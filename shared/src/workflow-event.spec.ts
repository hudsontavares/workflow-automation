import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { WorkflowEventSchema } from './workflow-event.js';

const workflowEvent = {
  _id: randomUUID(),
  source: 'github',
  deliveryId: randomUUID(),
  hookId: 42,
  type: 'github.pull_request.opened',
  repository: { id: 1, fullName: 'hudsontavares/test-repo' },
  data: { 'pr.number': 7, 'pr.title': 'Add tests' },
  status: 'dispatched',
  receivedAt: new Date(),
};

describe('WorkflowEventSchema', () => {
  it('accepts a dispatched event', () => {
    expect(WorkflowEventSchema.parse(workflowEvent)).toEqual(workflowEvent);
  });

  it('accepts an ignored event of a type no trigger handles', () => {
    const ignored = {
      ...workflowEvent,
      type: 'github.pull_request.closed',
      data: undefined,
      status: 'ignored',
      ignoredReason: 'unsupported_type',
    };

    expect(WorkflowEventSchema.safeParse(ignored).success).toBe(true);
  });

  it('rejects an unknown ignored reason', () => {
    expect(
      WorkflowEventSchema.safeParse({ ...workflowEvent, ignoredReason: 'too_busy' }).success,
    ).toBe(false);
  });
});
