import { Module } from '@nestjs/common';

import { ExecutionsModule } from '../executions/executions.module.js';
import { GithubModule } from '../github/github.module.js';
import { UsersModule } from '../users/users.module.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { WorkflowEventsRepository } from './workflow-events.repository.js';

@Module({
  imports: [ExecutionsModule, GithubModule, UsersModule, WorkflowsModule],
  controllers: [WebhooksController],
  providers: [WorkflowEventsRepository, WebhooksService],
})
export class WebhooksModule {}
