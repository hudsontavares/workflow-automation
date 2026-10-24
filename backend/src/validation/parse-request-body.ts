import { BadRequestException } from '@nestjs/common';
import type { z } from 'zod/mini';

export function parseRequestBody<Schema extends z.ZodMiniType>(
  schema: Schema,
  body: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      message: 'Invalid request body',
      issues: result.error.issues.map(({ path, message }) => ({ path, message })),
    });
  }
  return result.data;
}
