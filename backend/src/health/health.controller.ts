import { Controller, Get } from '@nestjs/common';
import { Db } from 'mongodb';

@Controller('health')
export class HealthController {
  constructor(private readonly db: Db) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    await this.db.command({ ping: 1 });
    return { status: 'ok' };
  }
}
