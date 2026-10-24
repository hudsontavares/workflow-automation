import { Injectable } from '@nestjs/common';
import { z } from 'zod/mini';

import { AppConfig } from '../config/app-config.js';

const GithubAccessTokenResponseSchema = z.object({
  access_token: z.string(),
  scope: z.string(),
});

const GithubUserResponseSchema = z.object({
  id: z.int(),
  login: z.string(),
  name: z.nullable(z.string()),
  avatar_url: z.url(),
});

const GithubRepositoriesResponseSchema = z.array(
  z.object({
    id: z.int(),
    full_name: z.string(),
    private: z.boolean(),
    permissions: z.object({ admin: z.boolean() }),
  }),
);

const GithubWebhookResponseSchema = z.object({ id: z.int() });

export interface GithubAccessToken {
  token: string;
  scopes: string[];
}

export interface GithubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface GithubUserRepository {
  id: number;
  fullName: string;
  private: boolean;
  isAdmin: boolean;
}

@Injectable()
export class GithubClient {
  constructor(private readonly config: AppConfig) {}

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GithubAccessToken> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.githubClientId,
        client_secret: this.config.githubClientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    // GitHub answers an invalid code with 200 and an error body, which fails this parse.
    const body = GithubAccessTokenResponseSchema.parse(await response.json());
    return { token: body.access_token, scopes: body.scope.split(',').filter(Boolean) };
  }

  async getAuthenticatedUser(token: string): Promise<GithubUserProfile> {
    const body = GithubUserResponseSchema.parse(await this.getFromApi('/user', token));
    return { id: body.id, login: body.login, name: body.name, avatarUrl: body.avatar_url };
  }

  async listRepositories(token: string): Promise<GithubUserRepository[]> {
    const path =
      '/user/repos?affiliation=owner,collaborator,organization_member&sort=updated&per_page=100';
    const body = GithubRepositoriesResponseSchema.parse(await this.getFromApi(path, token));
    return body.map((repository) => ({
      id: repository.id,
      fullName: repository.full_name,
      private: repository.private,
      isAdmin: repository.permissions.admin,
    }));
  }

  async createPullRequestWebhook(token: string, repositoryFullName: string): Promise<number> {
    const response = await this.requestApi('POST', `/repos/${repositoryFullName}/hooks`, token, {
      name: 'web',
      active: true,
      events: ['pull_request'],
      config: {
        url: this.config.githubWebhookUrl,
        content_type: 'json',
        secret: this.config.githubWebhookSecret,
      },
    });
    return GithubWebhookResponseSchema.parse(await response.json()).id;
  }

  async deleteWebhook(token: string, repositoryFullName: string, hookId: number): Promise<void> {
    await this.requestApi(
      'DELETE',
      `/repos/${repositoryFullName}/hooks/${hookId}`,
      token,
      undefined,
      {
        // The hook may already be gone, e.g. removed by hand on GitHub.
        acceptNotFound: true,
      },
    );
  }

  private async getFromApi(path: string, token: string): Promise<unknown> {
    const response = await this.requestApi('GET', path, token);
    return response.json();
  }

  private async requestApi(
    method: string,
    path: string,
    token: string,
    body?: unknown,
    { acceptNotFound = false } = {},
  ): Promise<Response> {
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'workflow-automation',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok && !(acceptNotFound && response.status === 404)) {
      throw new Error(`GitHub API ${method} ${path} responded with ${response.status}`);
    }
    return response;
  }
}
