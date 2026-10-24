import { createHmac, randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Db } from 'mongodb';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FakeGithubClient } from '../testing/fake-github-client.js';
import { createTestApp, signIn } from '../testing/test-app.js';
import { createTestConfig } from '../testing/test-config.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';

const webhookSecret = createTestConfig('mongodb://localhost/unused').githubWebhookSecret;

describe('POST /api/webhooks/github', () => {
  let database: TestDatabase;
  let app: INestApplication;
  const githubClient = new FakeGithubClient();

  beforeAll(async () => {
    database = await startTestDatabase();
    app = await createTestApp(database, githubClient);
  });

  afterEach(() => {
    githubClient.failCommentsWith = null;
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  async function createEnabledWorkflow() {
    const agent = await signIn(app);
    const connectionId: string = (await agent.get('/api/auth/me')).body.connections[0]._id;
    const input = {
      name: 'Thank PR authors',
      trigger: {
        type: 'github.pull_request.opened',
        connectionId,
        repository: { id: 1, fullName: 'octocat/administered' },
      },
      action: { type: 'github.pull_request.comment', connectionId, body: 'Thanks @{{pr.author}}!' },
    };
    const created = (await agent.post('/api/workflows').send(input)).body;
    const workflow = (
      await agent.put(`/api/workflows/${created._id}`).send({ ...input, enabled: true })
    ).body;
    return { agent, input, workflow, hookId: workflow.trigger.hookId as number };
  }

  function pullRequestPayload(action = 'opened') {
    return {
      action,
      repository: { id: 1, full_name: 'octocat/administered' },
      pull_request: {
        number: 7,
        title: 'Add tests',
        html_url: 'https://github.com/octocat/administered/pull/7',
        user: { login: 'alice' },
      },
    };
  }

  function deliver(
    hookId: number,
    payload: object = pullRequestPayload(),
    { deliveryId = randomUUID(), signature }: { deliveryId?: string; signature?: string } = {},
  ) {
    const body = JSON.stringify(payload);
    return request(app.getHttpServer())
      .post('/api/webhooks/github')
      .set('Content-Type', 'application/json')
      .set('X-GitHub-Event', 'pull_request')
      .set('X-GitHub-Delivery', deliveryId)
      .set('X-GitHub-Hook-ID', String(hookId))
      .set(
        'X-Hub-Signature-256',
        signature ?? `sha256=${createHmac('sha256', webhookSecret).update(body).digest('hex')}`,
      )
      .send(body);
  }

  const findEvent = (deliveryId: string) =>
    app.get(Db).collection('workflowEvents').findOne({ deliveryId });

  async function findExecution(deliveryId: string) {
    const event = await findEvent(deliveryId);
    return app.get(Db).collection('workflowExecutions').findOne({ eventId: event?._id });
  }

  describe('signature', () => {
    it('rejects a delivery with an invalid signature', async () => {
      const { hookId } = await createEnabledWorkflow();
      await deliver(hookId, undefined, { signature: 'sha256=forged' }).expect(401);
    });

    it('does not record a delivery with an invalid signature', async () => {
      const { hookId } = await createEnabledWorkflow();
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId, signature: 'sha256=forged' });
      expect(await findEvent(deliveryId)).toBeNull();
    });
  });

  describe('pull request opened', () => {
    it('comments with the rendered template', async () => {
      const { hookId } = await createEnabledWorkflow();
      await deliver(hookId);
      expect(githubClient.comments.at(-1)?.body).toBe('Thanks @alice!');
    });

    it('comments on the pull request that was opened', async () => {
      const { hookId } = await createEnabledWorkflow();
      await deliver(hookId);
      expect(githubClient.comments.at(-1)).toMatchObject({
        repositoryFullName: 'octocat/administered',
        issueNumber: 7,
      });
    });

    it('records a succeeded execution with the comment link', async () => {
      const { hookId } = await createEnabledWorkflow();
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId });
      expect((await findExecution(deliveryId))?.action.attempts[0].output.commentUrl).toMatch(
        /^https:\/\/github\.com\/octocat\/administered\/pull\/7#issuecomment-/,
      );
    });

    it('records a failed execution when GitHub refuses the comment', async () => {
      const { hookId } = await createEnabledWorkflow();
      githubClient.failCommentsWith = new Error('GitHub API responded with 403');
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId });
      expect((await findExecution(deliveryId))?.action.attempts[0].error.message).toBe(
        'GitHub API responded with 403',
      );
    });
  });

  describe('redeliveries', () => {
    it('answers a redelivery as a duplicate', async () => {
      const { hookId } = await createEnabledWorkflow();
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId });
      const response = await deliver(hookId, undefined, { deliveryId });
      expect(response.body).toEqual({ outcome: 'duplicate' });
    });

    it('comments only once for a redelivered event', async () => {
      const { hookId } = await createEnabledWorkflow();
      const deliveryId = randomUUID();
      const commentsBefore = githubClient.comments.length;
      await deliver(hookId, undefined, { deliveryId });
      await deliver(hookId, undefined, { deliveryId });
      expect(githubClient.comments.length - commentsBefore).toBe(1);
    });
  });

  describe('ignored deliveries', () => {
    async function ignoredReasonOf(deliveryId: string) {
      return (await findEvent(deliveryId))?.ignoredReason;
    }

    it('ignores pull request actions other than opened', async () => {
      const { hookId } = await createEnabledWorkflow();
      const deliveryId = randomUUID();
      await deliver(hookId, pullRequestPayload('closed'), { deliveryId });
      expect(await ignoredReasonOf(deliveryId)).toBe('unsupported_type');
    });

    it('ignores deliveries for a workflow that was turned off', async () => {
      const { agent, input, workflow, hookId } = await createEnabledWorkflow();
      await agent.put(`/api/workflows/${workflow._id}`).send({ ...input, enabled: false });
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId });
      expect(await ignoredReasonOf(deliveryId)).toBe('workflow_disabled');
    });

    it('ignores deliveries for a workflow that was deleted', async () => {
      const { agent, workflow, hookId } = await createEnabledWorkflow();
      await agent.delete(`/api/workflows/${workflow._id}`);
      const deliveryId = randomUUID();
      await deliver(hookId, undefined, { deliveryId });
      expect(await ignoredReasonOf(deliveryId)).toBe('workflow_deleted');
    });

    it('ignores deliveries from a hook no workflow owns', async () => {
      const deliveryId = randomUUID();
      await deliver(123456, undefined, { deliveryId });
      expect(await ignoredReasonOf(deliveryId)).toBe('unknown_hook');
    });
  });
});
