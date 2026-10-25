import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { CopilotBox } from './copilot-box';

describe('CopilotBox', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CopilotBox],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('explains why a request is not supported', async () => {
    const fixture = TestBed.createComponent(CopilotBox);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector('input')!.value = 'When a pull request is opened, post to Slack';
    element.querySelector('form')!.dispatchEvent(new Event('submit'));

    httpTesting
      .expectOne('/api/copilot/drafts')
      .flush({ status: 'unsupported', reason: 'Slack is not available yet.' });
    await fixture.whenStable();

    expect(element.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Slack is not available yet.',
    );
  });
});
