import type {
  Serialized,
  UpdateWorkflowConfigurationInput,
  WorkflowConfiguration,
} from '@workflow-automation/shared';

export function toUpdateInput(
  workflow: Serialized<WorkflowConfiguration>,
  enabled: boolean,
): UpdateWorkflowConfigurationInput {
  const { type, connectionId, repository } = workflow.trigger;
  return {
    name: workflow.name,
    enabled,
    trigger: { type, connectionId, repository },
    action: workflow.action,
  };
}
