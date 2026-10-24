import type { WorkflowConfiguration } from './workflow-configuration.js';
import type { WorkflowExecution } from './workflow-execution.js';

export interface ExecutionSummary {
  _id: string;
  status: WorkflowExecution['status'];
  ranAt: Date;
  repositoryFullName: string;
  pullRequestNumber: number;
  commentUrl: string | null;
  errorMessage: string | null;
}

export type WorkflowListItem = WorkflowConfiguration & {
  lastExecution: ExecutionSummary | null;
};
