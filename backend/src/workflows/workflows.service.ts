import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateWorkflowConfigurationInput,
  UpdateWorkflowConfigurationInput,
  WorkflowConfiguration,
} from '@workflow-automation/shared';
import { GithubClient } from '../github/github-client.js';
import { UsersRepository } from '../users/users.repository.js';
import { WorkflowsRepository } from './workflows.repository.js';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflows: WorkflowsRepository,
    private readonly users: UsersRepository,
    private readonly github: GithubClient,
  ) {}

  list(userId: string): Promise<WorkflowConfiguration[]> {
    return this.workflows.listForUser(userId);
  }

  async get(userId: string, workflowId: string): Promise<WorkflowConfiguration> {
    const workflow = await this.workflows.findForUser(userId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async create(
    userId: string,
    input: CreateWorkflowConfigurationInput,
  ): Promise<WorkflowConfiguration> {
    await this.ensureConnectionsBelongToUser(userId, input);
    const now = new Date();
    return this.workflows.save({
      _id: randomUUID(),
      userId,
      name: input.name,
      enabled: false,
      trigger: input.trigger,
      action: input.action,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  async update(
    userId: string,
    workflowId: string,
    input: UpdateWorkflowConfigurationInput,
  ): Promise<WorkflowConfiguration> {
    const current = await this.get(userId, workflowId);
    await this.ensureConnectionsBelongToUser(userId, input);

    const isSameRepository = current.trigger.repository.id === input.trigger.repository.id;
    const keepsWebhook = current.enabled && input.enabled && isSameRepository;
    if (current.enabled && !keepsWebhook) {
      await this.deleteWebhook(userId, current);
    }

    let hookId = keepsWebhook ? current.trigger.hookId : undefined;
    if (input.enabled && !keepsWebhook) {
      hookId = await this.createWebhook(userId, input.trigger);
    }

    return this.workflows.save({
      ...current,
      name: input.name,
      enabled: input.enabled,
      trigger: hookId === undefined ? input.trigger : { ...input.trigger, hookId },
      action: input.action,
      updatedAt: new Date(),
    });
  }

  async delete(userId: string, workflowId: string): Promise<void> {
    const current = await this.get(userId, workflowId);
    if (current.enabled) {
      await this.deleteWebhook(userId, current);
    }
    // An absent hookId, not a null one: the unique hookId index only skips missing fields.
    const triggerWithoutHook = { ...current.trigger };
    delete triggerWithoutHook.hookId;
    const now = new Date();
    await this.workflows.save({
      ...current,
      enabled: false,
      trigger: triggerWithoutHook,
      updatedAt: now,
      deletedAt: now,
    });
  }

  private async ensureConnectionsBelongToUser(
    userId: string,
    input: CreateWorkflowConfigurationInput,
  ): Promise<void> {
    for (const connectionId of new Set([input.trigger.connectionId, input.action.connectionId])) {
      if (!(await this.users.findGithubAccessToken(userId, connectionId))) {
        throw new BadRequestException(`Unknown connection ${connectionId}`);
      }
    }
  }

  private async createWebhook(
    userId: string,
    trigger: CreateWorkflowConfigurationInput['trigger'],
  ): Promise<number> {
    const token = await this.requireToken(userId, trigger.connectionId);
    return this.github.createPullRequestWebhook(token, trigger.repository.fullName);
  }

  private async deleteWebhook(userId: string, workflow: WorkflowConfiguration): Promise<void> {
    if (workflow.trigger.hookId === undefined) {
      return;
    }
    const token = await this.requireToken(userId, workflow.trigger.connectionId);
    await this.github.deleteWebhook(
      token,
      workflow.trigger.repository.fullName,
      workflow.trigger.hookId,
    );
  }

  private async requireToken(userId: string, connectionId: string): Promise<string> {
    const token = await this.users.findGithubAccessToken(userId, connectionId);
    if (!token) {
      throw new BadRequestException(`Unknown connection ${connectionId}`);
    }
    return token;
  }
}
