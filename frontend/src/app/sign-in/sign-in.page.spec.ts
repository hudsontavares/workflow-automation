import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SignInPage } from './sign-in.page';

async function renderWithError(error?: string): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(SignInPage);
  fixture.componentRef.setInput('error', error);
  await fixture.whenStable();
  return fixture.nativeElement;
}

describe('SignInPage', () => {
  it('explains that sign-in was cancelled on GitHub', async () => {
    const element = await renderWithError('access_denied');
    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Sign-in was cancelled on GitHub.',
    );
  });

  it('shows no error on a normal visit', async () => {
    const element = await renderWithError();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });
});
