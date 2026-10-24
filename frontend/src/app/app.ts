import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { SessionStore } from './core/session.store';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <a routerLink="/workflows" class="text-lg font-semibold text-slate-900"
          >Workflow Automation</a
        >
        @if (session.profile(); as profile) {
          <div class="flex items-center gap-3">
            <img [src]="profile.avatarUrl" alt="" class="h-7 w-7 rounded-full" />
            <span class="text-sm text-slate-700">{{ profile.name }}</span>
            <button
              type="button"
              class="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              (click)="session.signOut()"
            >
              Sign out
            </button>
          </div>
        }
      </div>
    </header>
    <main class="mx-auto max-w-4xl px-4 py-8">
      <router-outlet />
    </main>
  `,
})
export class App {
  protected readonly session = inject(SessionStore);
}
