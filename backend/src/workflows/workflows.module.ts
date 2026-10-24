import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { GithubModule } from '../github/github.module.js';
import { UsersModule } from '../users/users.module.js';
import { WorkflowsController } from './workflows.controller.js';
import { WorkflowsRepository } from './workflows.repository.js';
import { WorkflowsService } from './workflows.service.js';

@Module({
  imports: [AuthModule, GithubModule, UsersModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsRepository, WorkflowsService],
  exports: [WorkflowsRepository],
})
export class WorkflowsModule {}
