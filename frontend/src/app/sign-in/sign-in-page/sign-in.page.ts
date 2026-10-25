import { Component, computed, input } from '@angular/core';

const signInErrorMessages: Record<string, string> = {
  access_denied: 'Sign-in was cancelled on GitHub.',
  invalid_state: 'The sign-in could not be verified. Please try again.',
};

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in.page.html',
})
export class SignInPage {
  readonly error = input<string>();

  protected readonly errorMessage = computed(() => {
    const error = this.error();
    return error ? (signInErrorMessages[error] ?? 'Sign-in failed. Please try again.') : null;
  });
}
