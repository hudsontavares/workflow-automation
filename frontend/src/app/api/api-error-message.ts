import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string;
  issues?: { path: (string | number)[]; message: string }[];
}

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Something went wrong. Please try again.';
  }
  const body = error.error as ApiErrorBody | null;
  const issues = body?.issues?.map((issue) => issue.message).join(' ');
  return issues || body?.message || `The server answered ${error.status}.`;
}
