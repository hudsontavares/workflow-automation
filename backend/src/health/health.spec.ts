import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from '../testing/test-app.js';
import { startTestDatabase, type TestDatabase } from '../testing/test-database.js';

describe('GET /api/health', () => {
  let database: TestDatabase;
  let app: INestApplication;

  beforeAll(async () => {
    database = await startTestDatabase();
    app = await createTestApp(database);
  });

  afterAll(async () => {
    await app?.close();
    await database?.stop();
  });

  it('responds with 200 when MongoDB responds', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  it('reports an ok status', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
