import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestConfig } from '../testing/test-config.js';
import { GithubClient } from './github-client.js';

const githubClient = new GithubClient(createTestConfig('mongodb://localhost/unused'));

function repositoryPage(ids: number[], nextPage?: number): Response {
  const body = ids.map((id) => ({
    id,
    full_name: `octocat/repository-${id}`,
    private: false,
    permissions: { admin: true },
  }));
  const headers = nextPage
    ? { link: `<https://api.github.com/user/repos?per_page=100&page=${nextPage}>; rel="next"` }
    : undefined;
  return new Response(JSON.stringify(body), { status: 200, headers });
}

describe('GithubClient.listRepositories', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('follows the next-page links until the last page', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(repositoryPage([1, 2], 2))
      .mockResolvedValueOnce(repositoryPage([3]));

    const repositories = await githubClient.listRepositories('token');
    expect(repositories.map((repository) => repository.id)).toEqual([1, 2, 3]);
  });

  it('stops after ten pages', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => repositoryPage([1], 2));

    await githubClient.listRepositories('token');
    expect(fetchSpy).toHaveBeenCalledTimes(10);
  });
});
