import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FakeGithubClient } from '../testing/fake-github-client.js';
import { createTestApp, signIn } from '../testing/test-app.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';

describe('GET /api/connections/:connectionId/repositories', () => {
  let database: TestDatabase;
  let app: INestApplication;
  const githubClient = new FakeGithubClient();

  beforeAll(async () => {
    database = await startTestDatabase();
    app = await createTestApp(database, { githubClient });
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  async function listRepositoriesOfOwnConnection() {
    const agent = await signIn(app, 'repositories');
    const profile = (await agent.get('/api/auth/me')).body;
    return agent.get(`/api/connections/${profile.connections[0]._id}/repositories`);
  }

  it('lists only the repositories the user administers', async () => {
    const response = await listRepositoriesOfOwnConnection();
    expect(response.body).toEqual([{ id: 1, fullName: 'octocat/administered', private: false }]);
  });

  it('sorts the repositories by full name, ignoring case', async () => {
    const listedRepositories = githubClient.repositories;
    githubClient.repositories = [
      { id: 3, fullName: 'octocat/zeta', private: false, isAdmin: true },
      { id: 4, fullName: 'Octocat/Alpha', private: false, isAdmin: true },
      { id: 5, fullName: 'octocat/beta', private: true, isAdmin: true },
    ];
    const response = await listRepositoriesOfOwnConnection();
    githubClient.repositories = listedRepositories;
    expect(response.body.map((repository: { fullName: string }) => repository.fullName)).toEqual([
      'Octocat/Alpha',
      'octocat/beta',
      'octocat/zeta',
    ]);
  });

  it("calls GitHub with the connection's decrypted token", async () => {
    await listRepositoriesOfOwnConnection();
    expect(githubClient.tokensUsedToListRepositories.at(-1)).toBe('token-for-repositories');
  });

  it('answers 404 for a connection the user does not have', async () => {
    const agent = await signIn(app);
    await agent.get(`/api/connections/${randomUUID()}/repositories`).expect(404);
  });

  it('rejects a request without a session', async () => {
    await request(app.getHttpServer())
      .get(`/api/connections/${randomUUID()}/repositories`)
      .expect(401);
  });
});
