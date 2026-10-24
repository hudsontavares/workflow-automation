import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { SessionStore } from './session.store';

// The session check itself answers 401 for signed-out users; only later 401s mean the session expired.
const sessionCheckUrl = '/api/auth/me';

export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        request.url !== sessionCheckUrl
      ) {
        void session.endSession();
      }
      return throwError(() => error);
    }),
  );
};
