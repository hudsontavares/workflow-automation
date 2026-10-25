import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ConnectionsModule } from '../connections/connections.module.js';
import { UsersModule } from '../users/users.module.js';
import { CopilotClient } from './copilot-client.js';
import { CopilotController } from './copilot.controller.js';
import { CopilotService } from './copilot.service.js';

@Module({
  imports: [AuthModule, ConnectionsModule, UsersModule],
  controllers: [CopilotController],
  providers: [CopilotClient, CopilotService],
})
export class CopilotModule {}
