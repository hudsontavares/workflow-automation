import type {
  GithubAccessToken,
  GithubClient,
  GithubUserProfile,
  GithubUserRepository,
} from '../github/github-client.js';

export class FakeGithubClient implements Pick<
  GithubClient,
  | 'exchangeCodeForToken'
  | 'getAuthenticatedUser'
  | 'listRepositories'
  | 'createPullRequestWebhook'
  | 'deleteWebhook'
> {
  profile: GithubUserProfile = {
    id: 1001,
    login: 'octocat',
    name: 'Octo Cat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1001',
  };

  repositories: GithubUserRepository[] = [
    { id: 1, fullName: 'octocat/administered', private: false, isAdmin: true },
    { id: 2, fullName: 'someone/contributed', private: true, isAdmin: false },
  ];

  tokensUsedToListRepositories: string[] = [];

  redirectUrisUsedToExchangeCodes: string[] = [];

  createdWebhooks: { repositoryFullName: string; hookId: number }[] = [];

  deletedWebhooks: { repositoryFullName: string; hookId: number }[] = [];

  private nextHookId = 500;

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GithubAccessToken> {
    this.redirectUrisUsedToExchangeCodes.push(redirectUri);
    return { token: `token-for-${code}`, scopes: ['read:user', 'repo', 'admin:repo_hook'] };
  }

  async getAuthenticatedUser(): Promise<GithubUserProfile> {
    return this.profile;
  }

  async listRepositories(token: string): Promise<GithubUserRepository[]> {
    this.tokensUsedToListRepositories.push(token);
    return this.repositories;
  }

  async createPullRequestWebhook(_token: string, repositoryFullName: string): Promise<number> {
    const hookId = this.nextHookId++;
    this.createdWebhooks.push({ repositoryFullName, hookId });
    return hookId;
  }

  async deleteWebhook(_token: string, repositoryFullName: string, hookId: number): Promise<void> {
    this.deletedWebhooks.push({ repositoryFullName, hookId });
  }
}
