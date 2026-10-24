import { z } from 'zod/mini';

import { GithubRepositorySchema } from './github.js';

export const GithubWorkflowEventSchema = z.object({
  _id: z.uuid(),
  source: z.literal('github'),
  deliveryId: z.string().check(z.minLength(1)),
  hookId: z.int(),
  // What GitHub sent, e.g. 'github.pull_request.closed', even when no trigger handles it.
  type: z.string().check(z.minLength(1)),
  repository: GithubRepositorySchema,
  data: z.optional(z.record(z.string(), z.unknown())),
  status: z.enum(['received', 'dispatched', 'ignored']),
  ignoredReason: z.optional(
    z.enum(['unsupported_type', 'unknown_hook', 'workflow_disabled', 'workflow_deleted']),
  ),
  receivedAt: z.date(),
});

export const WorkflowEventSchema = z.discriminatedUnion('source', [GithubWorkflowEventSchema]);

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;
