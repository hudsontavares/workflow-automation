import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  type RawBodyRequest,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AppConfig } from '../config/app-config.js';
import { type GithubDelivery, readGithubDelivery } from './github-delivery.js';
import { isValidGithubSignature } from './github-signature.js';
import { WebhooksService } from './webhooks.service.js';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly config: AppConfig,
    private readonly webhooks: WebhooksService,
  ) {}

  @Post('github')
  @HttpCode(200)
  async receiveGithubDelivery(
    @Req() request: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
    @Body() payload: unknown,
  ): Promise<{ outcome: string }> {
    const rawBody = request.rawBody ?? Buffer.alloc(0);
    if (
      !isValidGithubSignature(
        this.config.githubWebhookSecret,
        rawBody,
        headers['x-hub-signature-256'],
      )
    ) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let delivery: GithubDelivery;
    try {
      delivery = readGithubDelivery(headers, payload);
    } catch {
      throw new BadRequestException('Unsupported webhook delivery');
    }
    return { outcome: await this.webhooks.handleGithubDelivery(delivery) };
  }
}
