import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { type ActionType, AppCatalog, type TriggerType } from '@workflow-automation/shared';
import { AppConfig } from '../config/app-config.js';

const copilotModel = 'claude-opus-5-5';

const triggerTypes = AppCatalog.flatMap((app) => app.triggers.map((trigger) => trigger.type));
const actionTypes = AppCatalog.flatMap((app) => app.actions.map((action) => action.type));

// Full zod rather than zod/mini: the SDK turns this schema into the structured output format.
const CopilotOutputSchema = z.object({
  name: z.string(),
  triggerType: z.enum(triggerTypes as [TriggerType, ...TriggerType[]]),
  actionType: z.enum(actionTypes as [ActionType, ...ActionType[]]),
  repositoryFullName: z.string().nullable(),
  body: z.string(),
  unsupportedReason: z.string().nullable(),
});

export type CopilotOutput = z.infer<typeof CopilotOutputSchema>;

/** Claude declined the request or returned something that does not fit the draft schema. */
export class CopilotDraftError extends Error {}

/** The Claude API could not be reached or rejected the call. */
export class CopilotUnavailableError extends Error {}

@Injectable()
export class CopilotClient {
  private readonly anthropic: Anthropic | null;

  constructor(config: AppConfig) {
    this.anthropic = config.anthropicApiKey
      ? new Anthropic({ apiKey: config.anthropicApiKey })
      : null;
  }

  get isConfigured(): boolean {
    return this.anthropic !== null;
  }

  async draftWorkflow(prompt: string, repositoryFullNames: string[]): Promise<CopilotOutput> {
    if (!this.anthropic) {
      throw new Error('Check isConfigured before asking the Copilot for a draft');
    }

    const response = await this.requestDraft(this.anthropic, prompt, repositoryFullNames);
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      throw new CopilotDraftError('The Copilot could not draft this workflow');
    }
    return response.parsed_output;
  }

  private async requestDraft(anthropic: Anthropic, prompt: string, repositoryFullNames: string[]) {
    try {
      return await anthropic.beta.messages.parse({
        model: copilotModel,
        max_tokens: 16000,
        // Retries on another model if the first one declines the request.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: betaZodOutputFormat(CopilotOutputSchema) },
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: buildUserMessage(prompt, repositoryFullNames) }],
      });
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new CopilotUnavailableError(
          `The Claude API answered ${error.status}: ${error.message}`,
        );
      }
      throw error;
    }
  }
}

function buildSystemPrompt(): string {
  const triggers = AppCatalog.flatMap((app) => app.triggers).map(
    (trigger) =>
      `- ${trigger.type} ("${trigger.label}"), template fields: ${trigger.outputFields.map((field) => `{{${field}}}`).join(', ')}`,
  );
  const actions = AppCatalog.flatMap((app) => app.actions).map(
    (action) =>
      `- ${action.type} ("${action.label}"), posts \`body\` as a comment on that pull request`,
  );
  const comingSoon = AppCatalog.filter((app) => app.status === 'coming_soon').map(
    (app) => app.name,
  );

  return [
    'You turn a description of an automation into a draft workflow for a GitHub automation app. A workflow has one trigger and one action. The user reviews the draft before saving it.',
    '',
    'Available triggers:',
    ...triggers,
    '',
    'Available actions:',
    ...actions,
    '',
    `Apps that are not available yet: ${comingSoon.join(', ')}.`,
    '',
    'Rules:',
    "- body is the comment text. It may use the trigger's template fields as {{field}}, and no other placeholders.",
    "- repositoryFullName is copied exactly from the user's repositories, or null when the description names none or none matches.",
    '- name is a short title for the workflow.',
    '- When the description needs an app, event or action that is not available, set unsupportedReason to one sentence saying what is missing. Otherwise set it to null.',
  ].join('\n');
}

function buildUserMessage(prompt: string, repositoryFullNames: string[]): string {
  const repositories = repositoryFullNames.length
    ? repositoryFullNames.map((fullName) => `- ${fullName}`).join('\n')
    : '(none)';
  return `Repositories the user can choose from:\n${repositories}\n\n<description>\n${prompt}\n</description>`;
}
