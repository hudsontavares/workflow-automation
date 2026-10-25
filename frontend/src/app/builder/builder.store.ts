import { computed, Injectable, signal } from '@angular/core';

import {
  type ActionType,
  type CreateWorkflowConfigurationInput,
  findCatalogTrigger,
  findUnknownTemplateFields,
  type GithubRepository,
  hasEmptyTemplatePlaceholder,
  renderTemplate,
  type Serialized,
  type TriggerType,
  type UpdateWorkflowConfigurationInput,
  type WorkflowConfiguration,
  type WorkflowDraft,
} from '@workflow-automation/shared';

const samplePullRequestData = {
  'pr.number': 42,
  'pr.title': 'Add a README',
  'pr.author': 'octocat',
  'pr.url': 'https://github.com/octocat/hello-world/pull/42',
};

const defaultCommentTemplate = 'Thanks @{{pr.author}} for opening "{{pr.title}}"!';

@Injectable()
export class BuilderStore {
  readonly name = signal('');
  readonly enabled = signal(false);
  readonly triggerAppId = signal('github');
  readonly actionAppId = signal('github');
  readonly triggerType = signal<TriggerType>('github.pull_request.opened');
  readonly actionType = signal<ActionType>('github.pull_request.comment');
  readonly connectionId = signal<string | null>(null);
  readonly repository = signal<GithubRepository | null>(null);
  readonly body = signal(defaultCommentTemplate);

  readonly outputFields = computed(
    () => findCatalogTrigger(this.triggerType())?.outputFields ?? [],
  );

  readonly templateErrors = computed(() => {
    const errors: string[] = [];
    if (hasEmptyTemplatePlaceholder(this.body())) {
      errors.push('Template placeholders cannot be empty');
    }
    const unknownFields = findUnknownTemplateFields(this.body(), this.triggerType());
    if (unknownFields.length > 0) {
      errors.push(`Unknown template fields: ${unknownFields.join(', ')}`);
    }
    return errors;
  });

  readonly preview = computed(() => renderTemplate(this.body(), samplePullRequestData));

  readonly canSave = computed(
    () =>
      this.name().trim() !== '' &&
      this.connectionId() !== null &&
      this.repository() !== null &&
      this.body().trim() !== '' &&
      this.templateErrors().length === 0,
  );

  load(workflow: Serialized<WorkflowConfiguration>): void {
    this.name.set(workflow.name);
    this.enabled.set(workflow.enabled);
    this.triggerType.set(workflow.trigger.type);
    this.actionType.set(workflow.action.type);
    this.connectionId.set(workflow.trigger.connectionId);
    this.repository.set(workflow.trigger.repository);
    this.body.set(workflow.action.body);
  }

  loadDraft(draft: WorkflowDraft): void {
    this.name.set(draft.name);
    this.triggerType.set(draft.triggerType);
    this.actionType.set(draft.actionType);
    this.repository.set(draft.repository);
    this.body.set(draft.body);
  }

  toCreateInput(): CreateWorkflowConfigurationInput {
    const connectionId = this.connectionId();
    const repository = this.repository();
    if (!connectionId || !repository) {
      throw new Error('The workflow needs a connection and a repository before it can be saved');
    }
    return {
      name: this.name().trim(),
      trigger: { type: this.triggerType(), connectionId, repository },
      action: { type: this.actionType(), connectionId, body: this.body() },
    };
  }

  toUpdateInput(): UpdateWorkflowConfigurationInput {
    return { ...this.toCreateInput(), enabled: this.enabled() };
  }
}
