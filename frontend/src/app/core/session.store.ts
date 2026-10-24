import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { UserProfile } from '@workflow-automation/shared';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private loading: Promise<void> | null = null;

  readonly profile = signal<UserProfile | null>(null);
  readonly isSignedIn = computed(() => this.profile() !== null);
  readonly githubConnectionId = computed(
    () =>
      this.profile()?.connections.find((connection) => connection.app === 'github')?._id ?? null,
  );

  /** Loads the signed-in user once; later calls reuse the same request. */
  ensureLoaded(): Promise<void> {
    this.loading ??= firstValueFrom(this.http.get<UserProfile>('/api/auth/me')).then(
      (profile) => this.profile.set(profile),
      () => this.profile.set(null),
    );
    return this.loading;
  }

  async signOut(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', null));
    await this.endSession();
  }

  async endSession(): Promise<void> {
    this.profile.set(null);
    await this.router.navigate(['/sign-in']);
  }
}
