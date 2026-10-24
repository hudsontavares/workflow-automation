import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  CreateWorkflowConfigurationInputSchema,
  UpdateWorkflowConfigurationInputSchema,
  WorkflowConfigurationSchema,
} from './workflow-configuration.js';

const connectionId = randomUUID();

const trigger = {
  type: 'github.pull_request.opened',
  connectionId,
  repository: { id: 1, fullName: 'hudsontavares/test-repo' },
};

const action = {
  type: 'github.pull_request.comment',
  connectionId,
  body: 'Thanks @{{pr.author}}!',
};

const workflowConfiguration = {
  _id: randomUUID(),
  userId: randomUUID(),
  name: 'Thank PR authors',
  enabled: false,
  trigger: { ...trigger, hookId: 42 },
  action,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('WorkflowConfigurationSchema', () => {
  it('accepts a stored workflow configuration', () => {
    expect(WorkflowConfigurationSchema.parse(workflowConfiguration)).toEqual(workflowConfiguration);
  });

  it('rejects a template that uses a field the trigger does not output', () => {
    const result = WorkflowConfigurationSchema.safeParse({
      ...workflowConfiguration,
      action: { ...action, body: 'Reviewed by {{pr.reviewer}}' },
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['action', 'body'],
        message: 'Unknown template fields: pr.reviewer',
      }),
    ]);
  });

  it('rejects a template with an empty placeholder', () => {
    const result = WorkflowConfigurationSchema.safeParse({
      ...workflowConfiguration,
      action: { ...action, body: 'Thanks {{ }}!' },
    });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['action', 'body'],
        message: 'Template placeholders cannot be empty',
      }),
    ]);
  });

  it('rejects an unsupported trigger type', () => {
    const result = WorkflowConfigurationSchema.safeParse({
      ...workflowConfiguration,
      trigger: { ...trigger, type: 'github.pull_request.closed' },
    });

    expect(result.success).toBe(false);
  });
});

describe('CreateWorkflowConfigurationInputSchema', () => {
  it('drops fields the system owns', () => {
    const input = CreateWorkflowConfigurationInputSchema.parse({
      name: 'Thank PR authors',
      enabled: true,
      userId: randomUUID(),
      trigger: { ...trigger, hookId: 42 },
      action,
    });

    expect(input).toEqual({ name: 'Thank PR authors', trigger, action });
  });

  it('rejects a template that uses a field the trigger does not output', () => {
    const result = CreateWorkflowConfigurationInputSchema.safeParse({
      name: 'Thank PR authors',
      trigger,
      action: { ...action, body: '{{pr.reviewer}}' },
    });

    expect(result.error?.issues[0]?.path).toEqual(['action', 'body']);
  });
});

describe('UpdateWorkflowConfigurationInputSchema', () => {
  it('requires the on/off state', () => {
    const result = UpdateWorkflowConfigurationInputSchema.safeParse({
      name: 'Thank PR authors',
      trigger,
      action,
    });

    expect(result.error?.issues[0]?.path).toEqual(['enabled']);
  });
});
