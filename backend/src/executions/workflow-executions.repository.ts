import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type Collection, Db } from 'mongodb';

import { type WorkflowExecution, WorkflowExecutionSchema } from '@workflow-automation/shared';
import { isDuplicateKeyError } from '../database/is-duplicate-key-error.js';

export const workflowExecutionsCollectionName = 'workflowExecutions';

@Injectable()
export class WorkflowExecutionsRepository implements OnModuleInit {
  private readonly executions: Collection<WorkflowExecution>;

  constructor(db: Db) {
    this.executions = db.collection<WorkflowExecution>(workflowExecutionsCollectionName);
  }

  async onModuleInit() {
    await this.executions.createIndexes([
      { key: { eventId: 1 }, unique: true },
      { key: { workflowConfigurationId: 1, createdAt: -1 } },
    ]);
  }

  /** Returns false when the event already has an execution: the unique eventId acts as a lock. */
  async insertIfNew(execution: WorkflowExecution): Promise<boolean> {
    try {
      await this.executions.insertOne(WorkflowExecutionSchema.parse(execution));
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return false;
      }
      throw error;
    }
  }

  async save(execution: WorkflowExecution): Promise<void> {
    const validExecution = WorkflowExecutionSchema.parse(execution);
    await this.executions.replaceOne({ _id: validExecution._id }, validExecution);
  }
}
