import { z } from 'zod/mini';

export const GithubRepositorySchema = z.object({
  id: z.int(),
  fullName: z.string().check(z.minLength(1)),
});

export type GithubRepository = z.infer<typeof GithubRepositorySchema>;

export const AccessibleGithubRepositorySchema = z.extend(GithubRepositorySchema, {
  private: z.boolean(),
});

export type AccessibleGithubRepository = z.infer<typeof AccessibleGithubRepositorySchema>;
