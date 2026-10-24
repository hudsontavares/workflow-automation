import { z } from 'zod/mini';

import { ActionSchema } from './actions.js';
import { findUnknownTemplateFields, hasEmptyTemplatePlaceholder } from './template.js';
import { TriggerInputSchema, TriggerSchema, type TriggerType } from './triggers.js';

const WorkflowConfigurationFieldsSchema = z.object({
  _id: z.uuid(),
  userId: z.uuid(),
  name: z.string().check(z.minLength(1)),
  enabled: z.boolean(),
  trigger: TriggerSchema,
  action: ActionSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.nullable(z.date()),
});

// z.pick and z.omit refuse schemas that already carry checks, so the check is attached to each schema separately.
function checkTemplateFields(ctx: {
  value: { trigger: { type: TriggerType }; action: { body: string } };
  issues: z.core.$ZodRawIssue[];
}) {
  const { body } = ctx.value.action;
  const reportBodyIssue = (message: string) =>
    ctx.issues.push({ code: 'custom', message, input: body, path: ['action', 'body'] });

  if (hasEmptyTemplatePlaceholder(body)) {
    reportBodyIssue('Template placeholders cannot be empty');
  }

  const unknownFields = findUnknownTemplateFields(body, ctx.value.trigger.type);
  if (unknownFields.length > 0) {
    reportBodyIssue(`Unknown template fields: ${unknownFields.join(', ')}`);
  }
}

export const WorkflowConfigurationSchema =
  WorkflowConfigurationFieldsSchema.check(checkTemplateFields);

export const CreateWorkflowConfigurationInputSchema = z
  .extend(z.pick(WorkflowConfigurationFieldsSchema, { name: true, action: true }), {
    trigger: TriggerInputSchema,
  })
  .check(checkTemplateFields);

export const UpdateWorkflowConfigurationInputSchema = z
  .extend(z.pick(WorkflowConfigurationFieldsSchema, { name: true, enabled: true, action: true }), {
    trigger: TriggerInputSchema,
  })
  .check(checkTemplateFields);

export type WorkflowConfiguration = z.infer<typeof WorkflowConfigurationSchema>;
export type CreateWorkflowConfigurationInput = z.infer<
  typeof CreateWorkflowConfigurationInputSchema
>;
export type UpdateWorkflowConfigurationInput = z.infer<
  typeof UpdateWorkflowConfigurationInputSchema
>;
