import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FakeGithubClient } from '../testing/fake-github-client.js';
import { createTestApp, signIn } from '../testing/test-app.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';

describe('Workflows API', () => {
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

  async function signInWithConnection() {
    const agent = await signIn(app);
    const connectionId: string = (await agent.get('/api/auth/me')).body.connections[0]._id;
    return { agent, connectionId };
  }

  async function signInAsAnotherUser() {
    const ownProfile = githubClient.profile;
    githubClient.profile = { ...ownProfile, id: 2002, login: 'hubot', name: 'Hubot' };
    const signedIn = await signInWithConnection();
    githubClient.profile = ownProfile;
    return signedIn;
  }

  function workflowInput(connectionId: string, repositoryFullName = 'octocat/administered') {
    return {
      name: 'Thank PR authors',
      trigger: {
        type: 'github.pull_request.opened',
        connectionId,
        repository: { id: repositoryFullName.length, fullName: repositoryFullName },
      },
      action: { type: 'github.pull_request.comment', connectionId, body: 'Thanks @{{pr.author}}!' },
    };
  }

  async function createWorkflow(repositoryFullName?: string) {
    const { agent, connectionId } = await signInWithConnection();
    const input = workflowInput(connectionId, repositoryFullName);
    const workflow = (await agent.post('/api/workflows').send(input)).body;
    return { agent, connectionId, input, workflow };
  }

  async function createEnabledWorkflow() {
    const created = await createWorkflow();
    const workflow = (
      await created.agent
        .put(`/api/workflows/${created.workflow._id}`)
        .send({ ...created.input, enabled: true })
    ).body;
    return { ...created, workflow };
  }

  describe('creating', () => {
    it('creates the workflow turned off', async () => {
      const { workflow } = await createWorkflow();
      expect(workflow.enabled).toBe(false);
    });

    it('lists the new workflow for its owner', async () => {
      const { agent, workflow } = await createWorkflow();
      const list = (await agent.get('/api/workflows')).body;
      expect(list.map((item: { _id: string }) => item._id)).toContain(workflow._id);
    });

    it('ignores a hook id sent by the client', async () => {
      const { agent, connectionId } = await signInWithConnection();
      const input = workflowInput(connectionId);
      const workflow = (
        await agent
          .post('/api/workflows')
          .send({ ...input, trigger: { ...input.trigger, hookId: 99 } })
      ).body;
      expect(workflow.trigger.hookId).toBeNull();
    });

    it('keeps several workflows that never had a webhook', async () => {
      const { agent, connectionId } = await signInWithConnection();
      await agent.post('/api/workflows').send(workflowInput(connectionId));
      await agent.post('/api/workflows').send(workflowInput(connectionId)).expect(201);
    });

    it('rejects a template that uses a field the trigger does not output', async () => {
      const { agent, connectionId } = await signInWithConnection();
      const input = workflowInput(connectionId);
      await agent
        .post('/api/workflows')
        .send({ ...input, action: { ...input.action, body: '{{pr.reviewer}}' } })
        .expect(400);
    });

    it("rejects another user's connection", async () => {
      const { agent } = await signInWithConnection();
      const { connectionId: otherConnectionId } = await signInAsAnotherUser();
      await agent.post('/api/workflows').send(workflowInput(otherConnectionId)).expect(400);
    });

    it('rejects a request without a session', async () => {
      await request(app.getHttpServer()).post('/api/workflows').send({}).expect(401);
    });
  });

  describe('ownership', () => {
    it("hides a workflow from other users' lists", async () => {
      const { workflow } = await createWorkflow();
      const { agent: otherAgent } = await signInAsAnotherUser();
      const list = (await otherAgent.get('/api/workflows')).body;
      expect(list.map((item: { _id: string }) => item._id)).not.toContain(workflow._id);
    });

    it('answers 404 when another user reads the workflow', async () => {
      const { workflow } = await createWorkflow();
      const { agent: otherAgent } = await signInAsAnotherUser();
      await otherAgent.get(`/api/workflows/${workflow._id}`).expect(404);
    });
  });

  describe('turning on and off', () => {
    it('creates a webhook on the repository when turned on', async () => {
      await createEnabledWorkflow();
      expect(githubClient.createdWebhooks.at(-1)?.repositoryFullName).toBe('octocat/administered');
    });

    it('keeps the id of the created webhook', async () => {
      const { workflow } = await createEnabledWorkflow();
      expect(workflow.trigger.hookId).toBe(githubClient.createdWebhooks.at(-1)?.hookId);
    });

    it('deletes the webhook when turned off', async () => {
      const { agent, input, workflow } = await createEnabledWorkflow();
      await agent.put(`/api/workflows/${workflow._id}`).send({ ...input, enabled: false });
      expect(githubClient.deletedWebhooks.at(-1)?.hookId).toBe(workflow.trigger.hookId);
    });

    it('keeps the last webhook id when turned off, so late deliveries still find it', async () => {
      const { agent, input, workflow } = await createEnabledWorkflow();
      const updated = (
        await agent.put(`/api/workflows/${workflow._id}`).send({ ...input, enabled: false })
      ).body;
      expect(updated.trigger.hookId).toBe(workflow.trigger.hookId);
    });

    it('moves the webhook when the repository changes while turned on', async () => {
      const { agent, connectionId, workflow } = await createEnabledWorkflow();
      await agent
        .put(`/api/workflows/${workflow._id}`)
        .send({ ...workflowInput(connectionId, 'octocat/another'), enabled: true });
      expect(githubClient.createdWebhooks.at(-1)?.repositoryFullName).toBe('octocat/another');
    });
  });

  describe('deleting', () => {
    it('removes the workflow from the list', async () => {
      const { agent, workflow } = await createWorkflow();
      await agent.delete(`/api/workflows/${workflow._id}`);
      const list = (await agent.get('/api/workflows')).body;
      expect(list.map((item: { _id: string }) => item._id)).not.toContain(workflow._id);
    });

    it('deletes the webhook of a workflow that was turned on', async () => {
      const { agent, workflow } = await createEnabledWorkflow();
      await agent.delete(`/api/workflows/${workflow._id}`);
      expect(githubClient.deletedWebhooks.at(-1)?.hookId).toBe(workflow.trigger.hookId);
    });
  });
});
