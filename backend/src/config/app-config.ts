import { z } from 'zod/mini';

const mongodbUriWithDatabasePattern = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/;

const EnvironmentSchema = z.object({
  PORT: z._default(z.coerce.number(), 3000),
  MONGODB_URI: z
    .string()
    .check(z.regex(mongodbUriWithDatabasePattern, 'MONGODB_URI must include a database name')),
  GITHUB_CLIENT_ID: z.string().check(z.minLength(1)),
  GITHUB_CLIENT_SECRET: z.string().check(z.minLength(1)),
  JWT_SECRET: z.string().check(z.minLength(32, 'JWT_SECRET must be at least 32 characters')),
  TOKEN_ENCRYPTION_KEY: z
    .base64()
    .check(
      z.refine(
        (key) => Buffer.from(key, 'base64').length === 32,
        'TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64',
      ),
    ),
});

export interface AppConfigValues {
  port: number;
  mongodbUri: string;
  githubClientId: string;
  githubClientSecret: string;
  jwtSecret: string;
  tokenEncryptionKey: Buffer;
}

export class AppConfig implements AppConfigValues {
  readonly port: number;
  readonly mongodbUri: string;
  readonly githubClientId: string;
  readonly githubClientSecret: string;
  readonly jwtSecret: string;
  readonly tokenEncryptionKey: Buffer;

  constructor(values: AppConfigValues) {
    this.port = values.port;
    this.mongodbUri = values.mongodbUri;
    this.githubClientId = values.githubClientId;
    this.githubClientSecret = values.githubClientSecret;
    this.jwtSecret = values.jwtSecret;
    this.tokenEncryptionKey = values.tokenEncryptionKey;
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv): AppConfig {
    const parsed = EnvironmentSchema.parse(environment);
    return new AppConfig({
      port: parsed.PORT,
      mongodbUri: parsed.MONGODB_URI,
      githubClientId: parsed.GITHUB_CLIENT_ID,
      githubClientSecret: parsed.GITHUB_CLIENT_SECRET,
      jwtSecret: parsed.JWT_SECRET,
      tokenEncryptionKey: Buffer.from(parsed.TOKEN_ENCRYPTION_KEY, 'base64'),
    });
  }
}
