import { z } from 'zod/mini';

export const GithubConnectionSchema = z.object({
  _id: z.uuid(),
  app: z.literal('github'),
  account: z.object({ id: z.int(), login: z.string() }),
  // Stored encrypted.
  accessToken: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.date(),
});

export const ConnectionSchema = z.discriminatedUnion('app', [GithubConnectionSchema]);

export const UserSchema = z.object({
  _id: z.uuid(),
  githubId: z.int(),
  name: z.string(),
  avatarUrl: z.url(),
  connections: z.array(ConnectionSchema),
  createdAt: z.date(),
});

export type Connection = z.infer<typeof ConnectionSchema>;
export type User = z.infer<typeof UserSchema>;
