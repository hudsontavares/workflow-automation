import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module.js';
import { configureApp } from '../app.setup.js';
import { AppConfig } from '../config/app-config.js';
import type { TestDatabase } from './test-database.js';

export async function createTestApp(database: TestDatabase): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AppConfig)
    .useValue(new AppConfig(0, database.uri))
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
