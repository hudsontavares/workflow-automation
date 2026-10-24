import { MongoServerError } from 'mongodb';

const duplicateKeyErrorCode = 11000;

export function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof MongoServerError && error.code === duplicateKeyErrorCode;
}
