import { z } from 'zod/mini';

export const GithubPullRequestCommentActionSchema = z.object({
  type: z.literal('github.pull_request.comment'),
  connectionId: z.uuid(),
  body: z.string().check(z.minLength(1)),
});

export const ActionSchema = z.discriminatedUnion('type', [GithubPullRequestCommentActionSchema]);

export type Action = z.infer<typeof ActionSchema>;
export type ActionType = Action['type'];
