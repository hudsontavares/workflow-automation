import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';

import type { AccessibleGithubRepository } from '@workflow-automation/shared';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { GithubClient } from '../github/github-client.js';
import { UsersRepository } from '../users/users.repository.js';

@Controller('connections')
@UseGuards(SessionGuard)
export class ConnectionsController {
  constructor(
    private readonly users: UsersRepository,
    private readonly github: GithubClient,
  ) {}

  @Get(':connectionId/repositories')
  async listRepositories(
    @CurrentUserId() userId: string,
    @Param('connectionId') connectionId: string,
  ): Promise<AccessibleGithubRepository[]> {
    const accessToken = await this.users.findGithubAccessToken(userId, connectionId);
    if (!accessToken) {
      throw new NotFoundException('Connection not found');
    }

    // Creating the workflow's webhook needs admin rights on the repository.
    const repositories = await this.github.listRepositories(accessToken);
    return repositories
      .filter((repository) => repository.isAdmin)
      .map(({ id, fullName, private: isPrivate }) => ({ id, fullName, private: isPrivate }));
  }
}
