import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.setup.js';
import { AppConfig } from '../config/app-config.js';
import { GithubClient } from '../github/github-client.js';
import { FakeGithubClient } from './fake-github-client.js';
import { createTestConfig } from './test-config.js';
import type { TestDatabase } from './test-database.js';

export async function createTestApp(
  database: TestDatabase,
  githubClient = new FakeGithubClient(),
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AppConfig)
    .useValue(createTestConfig(database.uri))
    .overrideProvider(GithubClient)
    .useValue(githubClient)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
  configureApp(app);
  await app.init();
  return app;
}

export async function signIn(app: INestApplication, code = 'test-code') {
  const agent = request.agent(app.getHttpServer());
  const start = await agent.get('/api/auth/github');
  const state = new URL(start.headers.location).searchParams.get('state');
  await agent.get('/api/auth/github/callback').query({ code, state });
  return agent;
}
