import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  CreateWorkflowConfigurationInputSchema,
  UpdateWorkflowConfigurationInputSchema,
  type WorkflowConfiguration,
  type WorkflowListItem,
} from '@workflow-automation/shared';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { parseRequestBody } from '../validation/parse-request-body.js';
import { WorkflowsService } from './workflows.service.js';

@Controller('workflows')
@UseGuards(SessionGuard)
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Get()
  list(@CurrentUserId() userId: string): Promise<WorkflowListItem[]> {
    return this.workflows.list(userId);
  }

  @Get(':workflowId')
  get(
    @CurrentUserId() userId: string,
    @Param('workflowId') workflowId: string,
  ): Promise<WorkflowConfiguration> {
    return this.workflows.get(userId, workflowId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() body: unknown): Promise<WorkflowConfiguration> {
    return this.workflows.create(
      userId,
      parseRequestBody(CreateWorkflowConfigurationInputSchema, body),
    );
  }

  @Put(':workflowId')
  update(
    @CurrentUserId() userId: string,
    @Param('workflowId') workflowId: string,
    @Body() body: unknown,
  ): Promise<WorkflowConfiguration> {
    return this.workflows.update(
      userId,
      workflowId,
      parseRequestBody(UpdateWorkflowConfigurationInputSchema, body),
    );
  }

  @Delete(':workflowId')
  @HttpCode(204)
  delete(@CurrentUserId() userId: string, @Param('workflowId') workflowId: string): Promise<void> {
    return this.workflows.delete(userId, workflowId);
  }
}
