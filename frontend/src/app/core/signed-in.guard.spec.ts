import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { signedInGuard } from './signed-in.guard';

describe('signedInGuard', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  async function runGuard(
    respond: (request: ReturnType<HttpTestingController['expectOne']>) => void,
  ) {
    const result = TestBed.runInInjectionContext(() =>
      signedInGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Promise<boolean | UrlTree>;
    respond(httpTesting.expectOne('/api/auth/me'));
    return result;
  }

  it('lets a signed-in user through', async () => {
    const result = await runGuard((request) =>
      request.flush({
        _id: 'user',
        name: 'Octo Cat',
        avatarUrl: 'https://example.com/a.png',
        connections: [],
      }),
    );
    expect(result).toBe(true);
  });

  it('sends a signed-out user to the sign-in page', async () => {
    const result = await runGuard((request) =>
      request.flush(null, { status: 401, statusText: 'Unauthorized' }),
    );
    expect(String(result)).toBe('/sign-in');
  });
});
