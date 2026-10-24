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

export const ConnectionSummarySchema = z.discriminatedUnion('app', [
  z.pick(GithubConnectionSchema, { _id: true, app: true, account: true }),
]);

export const UserProfileSchema = z.extend(
  z.pick(UserSchema, { _id: true, name: true, avatarUrl: true }),
  { connections: z.array(ConnectionSummarySchema) },
);

export type Connection = z.infer<typeof ConnectionSchema>;
export type ConnectionSummary = z.infer<typeof ConnectionSummarySchema>;
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
