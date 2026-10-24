import { Module } from '@nestjs/common';

import { GithubClient } from './github-client.js';

@Module({
  providers: [GithubClient],
  exports: [GithubClient],
})
export class GithubModule {}
