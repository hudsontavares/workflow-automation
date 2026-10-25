import { randomBytes } from 'node:crypto';

import { AppConfig } from '../config/app-config.js';

const unusedPort = 0;

export function createTestConfig(mongodbUri: string): AppConfig {
  return new AppConfig({
    port: unusedPort,
    mongodbUri,
    publicUrl: 'https://example.ngrok-free.dev',
    githubClientId: 'test-client-id',
    githubClientSecret: 'test-client-secret',
    githubWebhookSecret: 'test-webhook-secret',
    jwtSecret: 'test-jwt-secret-with-at-least-32-characters',
    tokenEncryptionKey: randomBytes(32),
    anthropicApiKey: 'test-anthropic-key',
  });
}
