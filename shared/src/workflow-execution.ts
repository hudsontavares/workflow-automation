import { z } from 'zod/mini';

import { GithubRepositorySchema } from './github.js';

const ExecutionStatusSchema = z.enum(['running', 'succeeded', 'failed']);

const ExecutionErrorSchema = z.object({
  message: z.string(),
  statusCode: z.optional(z.int()),
});

export const GithubPullRequestCommentExecutionSchema = z.object({
  type: z.literal('github.pull_request.comment'),
  input: z.object({
    repository: GithubRepositorySchema,
    pullRequestNumber: z.int(),
    body: z.string(),
  }),
  attempts: z
    .array(
      z.object({
        status: ExecutionStatusSchema,
        startedAt: z.date(),
        finishedAt: z.optional(z.date()),
        output: z.optional(z.object({ commentId: z.int(), commentUrl: z.url() })),
        error: z.optional(ExecutionErrorSchema),
      }),
    )
    .check(z.minLength(1)),
});

export const WorkflowExecutionSchema = z.object({
  _id: z.uuid(),
  workflowConfigurationId: z.uuid(),
  eventId: z.uuid(),
  userId: z.uuid(),
  // Mirrors the latest attempt's status, so runs can be filtered without searching the attempts.
  status: ExecutionStatusSchema,
  action: z.discriminatedUnion('type', [GithubPullRequestCommentExecutionSchema]),
  createdAt: z.date(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
