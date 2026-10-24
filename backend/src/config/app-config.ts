import { z } from 'zod/mini';

const EnvironmentSchema = z.object({
  PORT: z._default(z.coerce.number(), 3000),
  MONGODB_URI: z.string().check(z.minLength(1)),
});

export class AppConfig {
  constructor(
    readonly port: number,
    readonly mongodbUri: string,
  ) {}

  static fromEnvironment(environment: NodeJS.ProcessEnv): AppConfig {
    const parsed = EnvironmentSchema.parse(environment);
    return new AppConfig(parsed.PORT, parsed.MONGODB_URI);
  }
}
