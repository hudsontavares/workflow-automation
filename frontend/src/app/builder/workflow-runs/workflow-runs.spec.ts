import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runsRefreshIntervalMs, WorkflowRuns } from './workflow-runs';

const workflowId = '0b7c6f8e-1d2a-4c3b-8e5f-6a7b8c9d0e1f';

describe('WorkflowRuns', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WorkflowRuns],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderWithRuns(runs: object[]): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(WorkflowRuns);
    fixture.componentRef.setInput('workflowId', workflowId);
    fixture.detectChanges();
    httpTesting.expectOne(`/api/workflows/${workflowId}/executions`).flush(runs);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('invites the user to open a pull request when nothing ran yet', async () => {
    const element = await renderWithRuns([]);
    expect(element.querySelector('[data-testid="no-runs"]')).not.toBeNull();
  });

  it('links a succeeded run to its comment', async () => {
    const element = await renderWithRuns([
      {
        _id: 'run',
        status: 'succeeded',
        ranAt: new Date().toISOString(),
        repositoryFullName: 'octocat/hello-world',
        pullRequestNumber: 7,
        commentUrl: 'https://github.com/octocat/hello-world/pull/7#issuecomment-1',
        errorMessage: null,
      },
    ]);
    expect(element.querySelector('a')?.textContent?.trim()).toBe('Commented on PR #7');
  });

  it('checks for new runs every 10 seconds', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await renderWithRuns([]);
    vi.advanceTimersByTime(runsRefreshIntervalMs);
    TestBed.tick();
    expect(httpTesting.match(`/api/workflows/${workflowId}/executions`)).toHaveLength(1);
  });
});
