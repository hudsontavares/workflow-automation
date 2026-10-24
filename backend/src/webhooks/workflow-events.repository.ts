import { Injectable, type OnModuleInit } from '@nestjs/common';
import { type Collection, Db } from 'mongodb';

import { type WorkflowEvent, WorkflowEventSchema } from '@workflow-automation/shared';
import { isDuplicateKeyError } from '../database/is-duplicate-key-error.js';

@Injectable()
export class WorkflowEventsRepository implements OnModuleInit {
  private readonly events: Collection<WorkflowEvent>;

  constructor(db: Db) {
    this.events = db.collection<WorkflowEvent>('workflowEvents');
  }

  async onModuleInit() {
    await this.events.createIndexes([{ key: { source: 1, deliveryId: 1 }, unique: true }]);
  }

  /** Returns false when this delivery was already recorded, e.g. a redelivery from GitHub. */
  async insertIfNew(event: WorkflowEvent): Promise<boolean> {
    try {
      await this.events.insertOne(WorkflowEventSchema.parse(event));
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return false;
      }
      throw error;
    }
  }

  async save(event: WorkflowEvent): Promise<void> {
    const validEvent = WorkflowEventSchema.parse(event);
    await this.events.replaceOne({ _id: validEvent._id }, validEvent);
  }
}
