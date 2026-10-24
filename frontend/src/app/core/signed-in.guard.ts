import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { SessionStore } from './session.store';

export const signedInGuard: CanActivateFn = async () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  await session.ensureLoaded();
  return session.isSignedIn() || router.createUrlTree(['/sign-in']);
};
