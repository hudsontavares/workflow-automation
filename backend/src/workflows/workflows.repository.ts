import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type Collection, Db } from 'mongodb';

import {
  type LastExecutionSummary,
  type WorkflowConfiguration,
  WorkflowConfigurationSchema,
  type WorkflowExecution,
  type WorkflowListItem,
} from '@workflow-automation/shared';
import { workflowExecutionsCollectionName } from '../executions/workflow-executions.repository.js';

@Injectable()
export class WorkflowsRepository implements OnModuleInit {
  private readonly workflows: Collection<WorkflowConfiguration>;

  constructor(db: Db) {
    this.workflows = db.collection<WorkflowConfiguration>('workflowConfigurations');
  }

  async onModuleInit() {
    await this.workflows.createIndexes([
      { key: { userId: 1, deletedAt: 1 } },
      {
        key: { 'trigger.hookId': 1 },
        unique: true,
        // Only real hook ids are unique; workflows that never had a webhook all hold null.
        partialFilterExpression: { 'trigger.hookId': { $type: 'number' } },
      },
    ]);
  }

  async listForUser(userId: string): Promise<WorkflowListItem[]> {
    const workflows = await this.workflows
      .aggregate<WorkflowConfiguration & { latestExecutions: WorkflowExecution[] }>([
        { $match: { userId, deletedAt: null } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: workflowExecutionsCollectionName,
            localField: '_id',
            foreignField: 'workflowConfigurationId',
            pipeline: [{ $sort: { createdAt: -1 } }, { $limit: 1 }],
            as: 'latestExecutions',
          },
        },
      ])
      .toArray();

    return workflows.map(({ latestExecutions, ...workflow }) => ({
      ...workflow,
      lastExecution: summarizeExecution(latestExecutions[0]),
    }));
  }

  findForUser(userId: string, workflowId: string): Promise<WorkflowConfiguration | null> {
    return this.workflows.findOne({ _id: workflowId, userId, deletedAt: null });
  }

  findByHookId(hookId: number): Promise<WorkflowConfiguration | null> {
    return this.workflows.findOne({ 'trigger.hookId': hookId });
  }

  async save(workflow: WorkflowConfiguration): Promise<WorkflowConfiguration> {
    const validWorkflow = WorkflowConfigurationSchema.parse(workflow);
    await this.workflows.replaceOne({ _id: validWorkflow._id }, validWorkflow, { upsert: true });
    return validWorkflow;
  }
}

function summarizeExecution(execution: WorkflowExecution | undefined): LastExecutionSummary | null {
  if (!execution) {
    return null;
  }
  const lastAttempt = execution.action.attempts.at(-1);
  return {
    status: execution.status,
    ranAt: execution.createdAt,
    commentUrl: lastAttempt?.output?.commentUrl ?? null,
    errorMessage: lastAttempt?.error?.message ?? null,
  };
}
