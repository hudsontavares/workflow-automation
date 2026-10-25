import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type { CopilotDraftResponse } from '@workflow-automation/shared';
import { AccessibleRepositoriesService } from '../connections/accessible-repositories.service.js';
import { UsersRepository } from '../users/users.repository.js';
import {
  CopilotClient,
  CopilotDraftError,
  type CopilotOutput,
  CopilotUnavailableError,
} from './copilot-client.js';

@Injectable()
export class CopilotService {
  constructor(
    private readonly copilot: CopilotClient,
    private readonly users: UsersRepository,
    private readonly accessibleRepositories: AccessibleRepositoriesService,
  ) {}

  async draft(userId: string, prompt: string): Promise<CopilotDraftResponse> {
    if (!this.copilot.isConfigured) {
      throw new ServiceUnavailableException('The Copilot is not configured');
    }

    const profile = await this.users.findProfile(userId);
    const connectionId = profile?.connections.find(
      (connection) => connection.app === 'github',
    )?._id;
    const repositories = connectionId
      ? await this.accessibleRepositories.list(userId, connectionId)
      : null;
    if (!repositories) {
      throw new BadRequestException('Sign in with GitHub again to use the Copilot');
    }

    const output = await this.askCopilot(
      prompt,
      repositories.map((repository) => repository.fullName),
    );

    if (output.unsupportedReason) {
      return { status: 'unsupported', reason: output.unsupportedReason };
    }
    const repository = repositories.find(({ fullName }) => fullName === output.repositoryFullName);
    return {
      status: 'drafted',
      draft: {
        name: output.name,
        triggerType: output.triggerType,
        actionType: output.actionType,
        repository: repository ? { id: repository.id, fullName: repository.fullName } : null,
        body: output.body,
      },
    };
  }

  private async askCopilot(prompt: string, repositoryFullNames: string[]): Promise<CopilotOutput> {
    try {
      return await this.copilot.draftWorkflow(prompt, repositoryFullNames);
    } catch (error) {
      if (error instanceof CopilotDraftError) {
        throw new UnprocessableEntityException(error.message);
      }
      if (error instanceof CopilotUnavailableError) {
        throw new BadGatewayException('The Copilot is unavailable right now');
      }
      throw error;
    }
  }
}
