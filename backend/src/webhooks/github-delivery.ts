import { z } from 'zod/mini';

import type { GithubRepository } from '@workflow-automation/shared';

const GithubDeliveryHeadersSchema = z.object({
  'x-github-delivery': z.string().check(z.minLength(1)),
  'x-github-event': z.string().check(z.minLength(1)),
  'x-github-hook-id': z.coerce.number(),
});

const GithubDeliveryPayloadSchema = z.object({
  action: z.optional(z.string()),
  repository: z.object({ id: z.int(), full_name: z.string() }),
  pull_request: z.optional(
    z.object({
      number: z.int(),
      title: z.string(),
      html_url: z.url(),
      user: z.object({ login: z.string() }),
    }),
  ),
});

export interface GithubDelivery {
  deliveryId: string;
  hookId: number;
  type: string;
  repository: GithubRepository;
  data?: Record<string, unknown>;
}

export function readGithubDelivery(headers: unknown, payload: unknown): GithubDelivery {
  const parsedHeaders = GithubDeliveryHeadersSchema.parse(headers);
  const parsedPayload = GithubDeliveryPayloadSchema.parse(payload);
  const eventName = parsedHeaders['x-github-event'];
  const pullRequest = parsedPayload.pull_request;

  return {
    deliveryId: parsedHeaders['x-github-delivery'],
    hookId: parsedHeaders['x-github-hook-id'],
    type: parsedPayload.action
      ? `github.${eventName}.${parsedPayload.action}`
      : `github.${eventName}`,
    repository: { id: parsedPayload.repository.id, fullName: parsedPayload.repository.full_name },
    // Keyed by the output fields the app catalog declares for pull request triggers.
    data: pullRequest && {
      'pr.number': pullRequest.number,
      'pr.title': pullRequest.title,
      'pr.author': pullRequest.user.login,
      'pr.url': pullRequest.html_url,
    },
  };
}
