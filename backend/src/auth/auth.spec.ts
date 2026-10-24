import type { INestApplication } from '@nestjs/common';
import { Db } from 'mongodb';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FakeGithubClient } from '../testing/fake-github-client.js';
import { createTestApp, signIn } from '../testing/test-app.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';

describe('GitHub sign-in', () => {
  let database: TestDatabase;
  let app: INestApplication;
  const githubClient = new FakeGithubClient();

  beforeAll(async () => {
    database = await startTestDatabase();
    app = await createTestApp(database, githubClient);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  const startSignIn = () => request(app.getHttpServer()).get('/api/auth/github');

  const redirectUriOf = (response: request.Response) =>
    new URL(response.headers.location).searchParams.get('redirect_uri');

  describe('GET /api/auth/github', () => {
    it("redirects to GitHub's authorization page", async () => {
      const response = await startSignIn();
      expect(response.headers.location).toMatch(
        /^https:\/\/github\.com\/login\/oauth\/authorize\?/,
      );
    });

    it('asks for the scopes needed to read repositories and manage webhooks', async () => {
      const response = await startSignIn();
      expect(new URL(response.headers.location).searchParams.get('scope')).toBe(
        'read:user repo admin:repo_hook',
      );
    });

    it('asks GitHub to come back to the address the browser used', async () => {
      const response = await startSignIn().set('Host', 'localhost:3000');
      expect(redirectUriOf(response)).toBe('http://localhost:3000/api/auth/github/callback');
    });

    it('uses the public address forwarded by a local proxy such as ngrok', async () => {
      const response = await startSignIn()
        .set('X-Forwarded-Proto', 'https')
        .set('X-Forwarded-Host', 'example.ngrok-free.dev');
      expect(redirectUriOf(response)).toBe(
        'https://example.ngrok-free.dev/api/auth/github/callback',
      );
    });

    it('stores the state it sends to GitHub in a cookie', async () => {
      const response = await startSignIn();
      const state = new URL(response.headers.location).searchParams.get('state');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining(`github_sign_in_state=${state}`)]),
      );
    });
  });

  describe('GET /api/auth/github/callback', () => {
    it('rejects a state that does not match the cookie', async () => {
      const agent = request.agent(app.getHttpServer());
      await agent.get('/api/auth/github');
      await agent
        .get('/api/auth/github/callback')
        .query({ code: 'code', state: 'forged' })
        .expect(400);
    });

    async function signInThrough(host: string) {
      const agent = request.agent(app.getHttpServer());
      const start = await agent.get('/api/auth/github').set('Host', host);
      const state = new URL(start.headers.location).searchParams.get('state');
      const callback = await agent
        .get('/api/auth/github/callback')
        .set('Host', host)
        .query({ code: 'code', state });
      return { start, callback };
    }

    it('redirects back to the address the sign-in started from', async () => {
      const { callback } = await signInThrough('localhost:3000');
      expect(callback.headers.location).toBe('http://localhost:3000/');
    });

    it('exchanges the code with the same callback URL it sent to GitHub', async () => {
      const { start } = await signInThrough('localhost:3000');
      expect(githubClient.redirectUrisUsedToExchangeCodes.at(-1)).toBe(redirectUriOf(start));
    });

    it('stores the GitHub token encrypted', async () => {
      await signIn(app, 'plain');
      const user = await app.get(Db).collection('users').findOne({ githubId: 1001 });
      expect(user?.connections[0].accessToken).not.toContain('token-for-plain');
    });

    it('keeps the same user and connection when signing in again', async () => {
      const firstProfile = (await (await signIn(app)).get('/api/auth/me')).body;
      const secondProfile = (await (await signIn(app)).get('/api/auth/me')).body;
      expect(secondProfile).toEqual(firstProfile);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the profile and connections without the token', async () => {
      const agent = await signIn(app);
      const response = await agent.get('/api/auth/me');
      expect(response.body).toEqual({
        _id: expect.any(String),
        name: 'Octo Cat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1001',
        connections: [
          { _id: expect.any(String), app: 'github', account: { id: 1001, login: 'octocat' } },
        ],
      });
    });

    it('rejects a request without a session', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('ends the session', async () => {
      const agent = await signIn(app);
      await agent.post('/api/auth/logout');
      await agent.get('/api/auth/me').expect(401);
    });
  });
});
