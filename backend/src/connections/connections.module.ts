import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { GithubModule } from '../github/github.module.js';
import { UsersModule } from '../users/users.module.js';
import { AccessibleRepositoriesService } from './accessible-repositories.service.js';
import { ConnectionsController } from './connections.controller.js';

@Module({
  imports: [AuthModule, GithubModule, UsersModule],
  controllers: [ConnectionsController],
  providers: [AccessibleRepositoriesService],
  exports: [AccessibleRepositoriesService],
})
export class ConnectionsModule {}
