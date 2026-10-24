import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { WorkflowExecutionSchema } from './workflow-execution.js';

const execution = {
  _id: randomUUID(),
  workflowConfigurationId: randomUUID(),
  eventId: randomUUID(),
  userId: randomUUID(),
  status: 'succeeded',
  action: {
    type: 'github.pull_request.comment',
    input: {
      repository: { id: 1, fullName: 'hudsontavares/test-repo' },
      pullRequestNumber: 7,
      body: 'Thanks @hudsontavares!',
    },
    attempts: [
      {
        status: 'succeeded',
        startedAt: new Date(),
        finishedAt: new Date(),
        output: {
          commentId: 99,
          commentUrl: 'https://github.com/hudsontavares/test-repo/pull/7#issuecomment-99',
        },
      },
    ],
  },
  createdAt: new Date(),
};

describe('WorkflowExecutionSchema', () => {
  it('accepts a succeeded execution', () => {
    expect(WorkflowExecutionSchema.parse(execution)).toEqual(execution);
  });

  it('requires at least one attempt', () => {
    const result = WorkflowExecutionSchema.safeParse({
      ...execution,
      action: { ...execution.action, attempts: [] },
    });

    expect(result.error?.issues[0]?.path).toEqual(['action', 'attempts']);
  });
});
