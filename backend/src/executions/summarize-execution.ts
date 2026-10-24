import type { ExecutionSummary, WorkflowExecution } from '@workflow-automation/shared';

export function summarizeExecution(execution: WorkflowExecution): ExecutionSummary {
  const lastAttempt = execution.action.attempts.at(-1);
  return {
    _id: execution._id,
    status: execution.status,
    ranAt: execution.createdAt,
    repositoryFullName: execution.action.input.repository.fullName,
    pullRequestNumber: execution.action.input.pullRequestNumber,
    commentUrl: lastAttempt?.output?.commentUrl ?? null,
    errorMessage: lastAttempt?.error?.message ?? null,
  };
}
