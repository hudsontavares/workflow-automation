import { Injectable } from '@nestjs/common';

import type { AccessibleGithubRepository } from '@workflow-automation/shared';
import { GithubClient } from '../github/github-client.js';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class AccessibleRepositoriesService {
  constructor(
    private readonly users: UsersRepository,
    private readonly github: GithubClient,
  ) {}

  /** Returns null when the connection does not belong to the user. */
  async list(userId: string, connectionId: string): Promise<AccessibleGithubRepository[] | null> {
    const accessToken = await this.users.findGithubAccessToken(userId, connectionId);
    if (!accessToken) {
      return null;
    }

    // Creating the workflow's webhook needs admin rights on the repository.
    const repositories = await this.github.listRepositories(accessToken);
    return repositories
      .filter((repository) => repository.isAdmin)
      .map(({ id, fullName, private: isPrivate }) => ({ id, fullName, private: isPrivate }))
      .sort((first, second) =>
        first.fullName.localeCompare(second.fullName, undefined, { sensitivity: 'base' }),
      );
  }
}
