import { z } from 'zod/mini';

import { GithubRepositorySchema } from './github.js';

export const GithubPullRequestOpenedTriggerSchema = z.object({
  type: z.literal('github.pull_request.opened'),
  connectionId: z.uuid(),
  repository: GithubRepositorySchema,
  // Set by the system when the workflow is turned on, never taken from a request; null until then.
  hookId: z.nullable(z.int()),
});

export const TriggerSchema = z.discriminatedUnion('type', [GithubPullRequestOpenedTriggerSchema]);

export const TriggerInputSchema = z.discriminatedUnion('type', [
  z.omit(GithubPullRequestOpenedTriggerSchema, { hookId: true }),
]);

export type Trigger = z.infer<typeof TriggerSchema>;
export type TriggerType = Trigger['type'];
