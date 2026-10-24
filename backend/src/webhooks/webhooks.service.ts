import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import {
  renderTemplate,
  type WorkflowConfiguration,
  type WorkflowEvent,
  type WorkflowExecution,
} from '@workflow-automation/shared';
import { WorkflowExecutionsRepository } from '../executions/workflow-executions.repository.js';
import { GithubClient } from '../github/github-client.js';
import { UsersRepository } from '../users/users.repository.js';
import { WorkflowsRepository } from '../workflows/workflows.repository.js';
import type { GithubDelivery } from './github-delivery.js';
import { WorkflowEventsRepository } from './workflow-events.repository.js';

type DeliveryOutcome = 'dispatched' | 'ignored' | 'duplicate';
type IgnoredReason = NonNullable<WorkflowEvent['ignoredReason']>;

@Injectable()
export class WebhooksService {
  constructor(
    private readonly events: WorkflowEventsRepository,
    private readonly workflows: WorkflowsRepository,
    private readonly executions: WorkflowExecutionsRepository,
    private readonly users: UsersRepository,
    private readonly github: GithubClient,
  ) {}

  async handleGithubDelivery(delivery: GithubDelivery): Promise<DeliveryOutcome> {
    const event: WorkflowEvent = {
      _id: randomUUID(),
      source: 'github',
      ...delivery,
      status: 'received',
      receivedAt: new Date(),
    };
    if (!(await this.events.insertIfNew(event))) {
      return 'duplicate';
    }

    const route = routeEvent(event, await this.workflows.findByHookId(delivery.hookId));
    if ('ignoredReason' in route) {
      await this.events.save({ ...event, status: 'ignored', ignoredReason: route.ignoredReason });
      return 'ignored';
    }

    await this.events.save({ ...event, status: 'dispatched' });
    await this.execute(route.workflow, event);
    return 'dispatched';
  }

  private async execute(workflow: WorkflowConfiguration, event: WorkflowEvent): Promise<void> {
    const data = event.data ?? {};
    const startedAt = new Date();
    const execution: WorkflowExecution = {
      _id: randomUUID(),
      workflowConfigurationId: workflow._id,
      eventId: event._id,
      userId: workflow.userId,
      status: 'running',
      action: {
        type: workflow.action.type,
        input: {
          repository: event.repository,
          pullRequestNumber: Number(data['pr.number']),
          body: renderTemplate(workflow.action.body, data),
        },
        attempts: [{ status: 'running', startedAt }],
      },
      createdAt: startedAt,
    };
    if (!(await this.executions.insertIfNew(execution))) {
      return;
    }

    const { input } = execution.action;
    let attempt: WorkflowExecution['action']['attempts'][number];
    try {
      const token = await this.users.findGithubAccessToken(
        workflow.userId,
        workflow.action.connectionId,
      );
      if (!token) {
        throw new Error('The GitHub connection of this workflow no longer exists');
      }
      const comment = await this.github.commentOnIssue(
        token,
        input.repository.fullName,
        input.pullRequestNumber,
        input.body,
      );
      attempt = {
        status: 'succeeded',
        startedAt,
        finishedAt: new Date(),
        output: { commentId: comment.id, commentUrl: comment.url },
      };
    } catch (error) {
      attempt = {
        status: 'failed',
        startedAt,
        finishedAt: new Date(),
        error: { message: error instanceof Error ? error.message : String(error) },
      };
    }

    await this.executions.save({
      ...execution,
      status: attempt.status,
      action: { ...execution.action, attempts: [attempt] },
    });
  }
}

function routeEvent(
  event: WorkflowEvent,
  workflow: WorkflowConfiguration | null,
): { workflow: WorkflowConfiguration } | { ignoredReason: IgnoredReason } {
  if (!workflow) {
    return { ignoredReason: 'unknown_hook' };
  }
  if (workflow.deletedAt) {
    return { ignoredReason: 'workflow_deleted' };
  }
  if (!workflow.enabled) {
    return { ignoredReason: 'workflow_disabled' };
  }
  if (event.type !== workflow.trigger.type) {
    return { ignoredReason: 'unsupported_type' };
  }
  return { workflow };
}
