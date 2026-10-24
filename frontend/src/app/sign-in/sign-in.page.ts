import { Component, computed, input } from '@angular/core';

const signInErrorMessages: Record<string, string> = {
  access_denied: 'Sign-in was cancelled on GitHub.',
  invalid_state: 'The sign-in could not be verified. Please try again.',
};

@Component({
  selector: 'app-sign-in-page',
  template: `
    <section
      class="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center"
    >
      <h1 class="text-2xl font-semibold">Automate your pull requests</h1>
      <p class="mt-2 text-slate-600">
        Build workflows that react to GitHub events, like commenting on every pull request that is
        opened.
      </p>
      @if (errorMessage()) {
        <p role="alert" class="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          {{ errorMessage() }}
        </p>
      }
      <a
        href="/api/auth/github"
        class="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
      >
        Sign in with GitHub
      </a>
    </section>
  `,
})
export class SignInPage {
  readonly error = input<string>();

  protected readonly errorMessage = computed(() => {
    const error = this.error();
    return error ? (signInErrorMessages[error] ?? 'Sign-in failed. Please try again.') : null;
  });
}
