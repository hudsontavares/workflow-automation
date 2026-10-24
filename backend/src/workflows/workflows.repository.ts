import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type Collection, Db } from 'mongodb';

import {
  type WorkflowConfiguration,
  WorkflowConfigurationSchema,
} from '@workflow-automation/shared';

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
        partialFilterExpression: { 'trigger.hookId': { $exists: true } },
      },
    ]);
  }

  listForUser(userId: string): Promise<WorkflowConfiguration[]> {
    return this.workflows.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).toArray();
  }

  findForUser(userId: string, workflowId: string): Promise<WorkflowConfiguration | null> {
    return this.workflows.findOne({ _id: workflowId, userId, deletedAt: null });
  }

  async save(workflow: WorkflowConfiguration): Promise<WorkflowConfiguration> {
    const validWorkflow = WorkflowConfigurationSchema.parse(workflow);
    await this.workflows.replaceOne({ _id: validWorkflow._id }, validWorkflow, { upsert: true });
    return validWorkflow;
  }
}
