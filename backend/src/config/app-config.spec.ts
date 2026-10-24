import { describe, expect, it } from 'vitest';

import { AppConfig } from './app-config.js';

const environment = {
  MONGODB_URI: 'mongodb://localhost:27117/app',
  PUBLIC_URL: 'https://example.ngrok-free.dev',
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  GITHUB_WEBHOOK_SECRET: 'a-webhook-secret',
  JWT_SECRET: 'a-jwt-secret-with-at-least-32-characters',
  TOKEN_ENCRYPTION_KEY: 'a-token-encryption-secret-of-32-characters',
};

describe('AppConfig.fromEnvironment', () => {
  it('reads the database URI', () => {
    expect(AppConfig.fromEnvironment(environment).mongodbUri).toBe('mongodb://localhost:27117/app');
  });

  it('defaults the port to 3000', () => {
    expect(AppConfig.fromEnvironment(environment).port).toBe(3000);
  });

  it('derives a 32-byte encryption key from the secret', () => {
    expect(AppConfig.fromEnvironment(environment).tokenEncryptionKey).toHaveLength(32);
  });

  it('builds the GitHub webhook URL from the public URL', () => {
    expect(AppConfig.fromEnvironment(environment).githubWebhookUrl).toBe(
      'https://example.ngrok-free.dev/api/webhooks/github',
    );
  });

  it('rejects a database URI without a database name', () => {
    expect(() =>
      AppConfig.fromEnvironment({ ...environment, MONGODB_URI: 'mongodb://localhost:27117' }),
    ).toThrow('MONGODB_URI must include a database name');
  });

  it('rejects a token encryption secret shorter than 32 characters', () => {
    expect(() =>
      AppConfig.fromEnvironment({ ...environment, TOKEN_ENCRYPTION_KEY: 'too-short' }),
    ).toThrow('TOKEN_ENCRYPTION_KEY must be at least 32 characters');
  });
});
