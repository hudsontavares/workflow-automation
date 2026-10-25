import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FakeCopilotClient } from '../testing/fake-copilot-client.js';
import { createTestApp, signIn } from '../testing/test-app.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';
import { CopilotDraftError } from './copilot-client.js';

describe('POST /api/copilot/drafts', () => {
  let database: TestDatabase;
  let app: INestApplication;
  let unconfiguredApp: INestApplication;
  const copilotClient = new FakeCopilotClient();
  const defaultOutput = copilotClient.output;

  beforeAll(async () => {
    database = await startTestDatabase();
    app = await createTestApp(database, { copilotClient });
    const unconfiguredCopilotClient = new FakeCopilotClient();
    unconfiguredCopilotClient.isConfigured = false;
    unconfiguredApp = await createTestApp(database, { copilotClient: unconfiguredCopilotClient });
  });

  afterEach(() => {
    copilotClient.output = defaultOutput;
    copilotClient.failWith = null;
  });

  afterAll(async () => {
    await app?.close();
    await unconfiguredApp?.close();
    await database?.stop();
  });

  async function draft(prompt = 'When a pull request is opened, comment thanks') {
    const agent = await signIn(app);
    return agent.post('/api/copilot/drafts').send({ prompt });
  }

  it('returns the drafted workflow with the matching repository', async () => {
    const response = await draft();
    expect(response.body).toEqual({
      status: 'drafted',
      draft: {
        name: 'Thank PR authors',
        triggerType: 'github.pull_request.opened',
        actionType: 'github.pull_request.comment',
        repository: { id: 1, fullName: 'octocat/administered' },
        body: 'Thanks @{{pr.author}}!',
      },
    });
  });

  it('offers Claude only the repositories the user administers', async () => {
    await draft();
    expect(copilotClient.repositoriesOffered.at(-1)).toEqual(['octocat/administered']);
  });

  it('leaves the repository empty when Claude names one the user cannot pick', async () => {
    copilotClient.output = { ...defaultOutput, repositoryFullName: 'someone/else' };
    const response = await draft();
    expect(response.body.draft.repository).toBeNull();
  });

  it('explains when the request needs something that is not available', async () => {
    copilotClient.output = { ...defaultOutput, unsupportedReason: 'Slack is not available yet.' };
    const response = await draft('When a pull request is opened, post to Slack');
    expect(response.body).toEqual({ status: 'unsupported', reason: 'Slack is not available yet.' });
  });

  it('answers 422 when Claude cannot draft the workflow', async () => {
    copilotClient.failWith = new CopilotDraftError('The Copilot could not draft this workflow');
    const response = await draft();
    expect(response.status).toBe(422);
  });

  it('rejects an empty description', async () => {
    const response = await draft('   ');
    expect(response.status).toBe(400);
  });

  it('answers 503 when no Anthropic API key is configured', async () => {
    const agent = await signIn(unconfiguredApp);
    await agent.post('/api/copilot/drafts').send({ prompt: 'Comment thanks' }).expect(503);
  });

  it('rejects a request without a session', async () => {
    await request(app.getHttpServer())
      .post('/api/copilot/drafts')
      .send({ prompt: 'x' })
      .expect(401);
  });
});
