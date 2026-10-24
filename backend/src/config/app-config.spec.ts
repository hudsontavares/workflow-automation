import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config.js';

describe('AppConfig.fromEnvironment', () => {
  it('reads the database URI', () => {
    const config = AppConfig.fromEnvironment({ MONGODB_URI: 'mongodb://localhost:27117/app' });
    expect(config.mongodbUri).toBe('mongodb://localhost:27117/app');
  });

  it('defaults the port to 3000', () => {
    const config = AppConfig.fromEnvironment({ MONGODB_URI: 'mongodb://localhost:27117/app' });
    expect(config.port).toBe(3000);
  });

  it('rejects a database URI without a database name', () => {
    expect(() => AppConfig.fromEnvironment({ MONGODB_URI: 'mongodb://localhost:27117' })).toThrow(
      'MONGODB_URI must include a database name',
    );
  });
});
