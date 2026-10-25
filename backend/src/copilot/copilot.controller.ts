import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';

import { CopilotDraftRequestSchema, type CopilotDraftResponse } from '@workflow-automation/shared';
import { CurrentUserId, SessionGuard } from '../auth/session.guard.js';
import { parseRequestBody } from '../validation/parse-request-body.js';
import { CopilotService } from './copilot.service.js';

@Controller('copilot')
@UseGuards(SessionGuard)
export class CopilotController {
  constructor(private readonly copilot: CopilotService) {}

  @Post('drafts')
  @HttpCode(200)
  draft(@CurrentUserId() userId: string, @Body() body: unknown): Promise<CopilotDraftResponse> {
    const { prompt } = parseRequestBody(CopilotDraftRequestSchema, body);
    return this.copilot.draft(userId, prompt);
  }
}
