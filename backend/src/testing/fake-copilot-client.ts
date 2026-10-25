import type { CopilotClient, CopilotOutput } from '../copilot/copilot-client.js';

export class FakeCopilotClient implements Pick<CopilotClient, 'draftWorkflow' | 'isConfigured'> {
  output: CopilotOutput = {
    name: 'Thank PR authors',
    triggerType: 'github.pull_request.opened',
    actionType: 'github.pull_request.comment',
    repositoryFullName: 'octocat/administered',
    body: 'Thanks @{{pr.author}}!',
    unsupportedReason: null,
  };

  isConfigured = true;

  failWith: Error | null = null;

  repositoriesOffered: string[][] = [];

  async draftWorkflow(_prompt: string, repositoryFullNames: string[]): Promise<CopilotOutput> {
    this.repositoriesOffered.push(repositoryFullNames);
    if (this.failWith) {
      throw this.failWith;
    }
    return this.output;
  }
}
