import { Module } from '@nestjs/common';

import { WorkflowExecutionsRepository } from './workflow-executions.repository.js';

@Module({
  providers: [WorkflowExecutionsRepository],
  exports: [WorkflowExecutionsRepository],
})
export class ExecutionsModule {}
