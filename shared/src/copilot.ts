import { z } from 'zod/mini';

import type { ActionType } from './actions.js';
import type { GithubRepository } from './github.js';
import type { TriggerType } from './triggers.js';

export const CopilotDraftRequestSchema = z.object({
  prompt: z.string().check(z.trim(), z.minLength(1), z.maxLength(500)),
});

export interface WorkflowDraft {
  name: string;
  triggerType: TriggerType;
  actionType: ActionType;
  repository: GithubRepository | null;
  body: string;
}

export type CopilotDraftResponse =
  { status: 'drafted'; draft: WorkflowDraft } | { status: 'unsupported'; reason: string };

export type CopilotDraftRequest = z.infer<typeof CopilotDraftRequestSchema>;
