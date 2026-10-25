import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';

import type { AccessibleGithubRepository } from '@workflow-automation/shared';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { AccessibleRepositoriesService } from './accessible-repositories.service.js';

@Controller('connections')
@UseGuards(SessionGuard)
export class ConnectionsController {
  constructor(private readonly accessibleRepositories: AccessibleRepositoriesService) {}

  @Get(':connectionId/repositories')
  async listRepositories(
    @CurrentUserId() userId: string,
    @Param('connectionId') connectionId: string,
  ): Promise<AccessibleGithubRepository[]> {
    const repositories = await this.accessibleRepositories.list(userId, connectionId);
    if (!repositories) {
      throw new NotFoundException('Connection not found');
    }
    return repositories;
  }
}
