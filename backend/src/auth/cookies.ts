import type { CookieOptions } from 'express';

export const sessionCookieName = 'session';
export const signInStateCookieName = 'github_sign_in_state';

export const sessionMaxAgeMs = 8 * 60 * 60 * 1000;
export const signInStateMaxAgeMs = 10 * 60 * 1000;

export function cookieOptions(secure: boolean, maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    // 'lax' still sends the cookie when GitHub redirects the browser back to the callback.
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: maxAgeMs,
  };
}
