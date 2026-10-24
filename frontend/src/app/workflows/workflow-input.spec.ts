import { describe, expect, it } from 'vitest';

import type { Serialized, WorkflowConfiguration } from '@workflow-automation/shared';
import { toUpdateInput } from './workflow-input';

const workflow: Serialized<WorkflowConfiguration> = {
  _id: '0b7c6f8e-1d2a-4c3b-8e5f-6a7b8c9d0e1f',
  userId: '1c8d7a9f-2e3b-4d4c-9f6a-7b8c9d0e1f2a',
  name: 'Thank PR authors',
  enabled: true,
  trigger: {
    type: 'github.pull_request.opened',
    connectionId: '2d9e8b0a-3f4c-4e5d-8a7b-8c9d0e1f2a3b',
    repository: { id: 1, fullName: 'octocat/hello-world' },
    hookId: 500,
  },
  action: {
    type: 'github.pull_request.comment',
    connectionId: '2d9e8b0a-3f4c-4e5d-8a7b-8c9d0e1f2a3b',
    body: 'Thanks!',
  },
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
  deletedAt: null,
};

describe('toUpdateInput', () => {
  it('flips the on/off state', () => {
    expect(toUpdateInput(workflow, false).enabled).toBe(false);
  });

  it('leaves out the hook id the server owns', () => {
    expect(toUpdateInput(workflow, false).trigger).not.toHaveProperty('hookId');
  });
});
