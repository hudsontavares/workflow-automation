import type { WorkflowConfiguration } from './workflow-configuration.js';
import type { WorkflowExecution } from './workflow-execution.js';

export interface LastExecutionSummary {
  status: WorkflowExecution['status'];
  ranAt: Date;
  commentUrl: string | null;
  errorMessage: string | null;
}

export type WorkflowListItem = WorkflowConfiguration & {
  lastExecution: LastExecutionSummary | null;
};
