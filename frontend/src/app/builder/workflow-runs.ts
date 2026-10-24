import { Component, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { WorkflowsApi } from '../api/workflows.api';
import { formatRelativeTime } from '../workflows/format-relative-time';

export const runsRefreshIntervalMs = 10_000;

@Component({
  selector: 'app-workflow-runs',
  template: `
    <h2 class="mb-3 font-semibold">Recent runs</h2>
    @if (runs.isLoading() && !runs.hasValue()) {
      <p class="text-sm text-slate-600">Loading…</p>
    } @else if (runs.error()) {
      <p role="alert" class="text-sm text-rose-700">The runs could not be loaded.</p>
    } @else if (runs.value()?.length === 0) {
      <p class="text-sm text-slate-600" data-testid="no-runs">
        No runs yet. Open a pull request on the repository to see one here.
      </p>
    } @else {
      <ul class="divide-y divide-slate-100 text-sm">
        @for (run of runs.value(); track run._id) {
          <li class="flex items-center gap-3 py-2">
            <span
              class="w-20 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium"
              [class]="statusClasses[run.status]"
            >
              {{ statusLabels[run.status] }}
            </span>
            <span class="w-24 shrink-0 text-slate-600">{{ formatRelativeTime(run.ranAt) }}</span>
            <span class="min-w-0 flex-1 truncate">
              @if (run.commentUrl) {
                <a [href]="run.commentUrl" target="_blank" rel="noopener" class="hover:underline">
                  Commented on PR #{{ run.pullRequestNumber }}
                </a>
              } @else {
                PR #{{ run.pullRequestNumber }} on {{ run.repositoryFullName }}
              }
              @if (run.errorMessage) {
                <span class="block text-rose-700">{{ run.errorMessage }}</span>
              }
            </span>
          </li>
        }
      </ul>
    }
  `,
})
export class WorkflowRuns {
  readonly workflowId = input.required<string>();

  private readonly workflowsApi = inject(WorkflowsApi);

  protected readonly runs = rxResource({
    params: () => this.workflowId(),
    stream: ({ params: workflowId }) => this.workflowsApi.listRecentExecutions(workflowId),
  });

  protected readonly statusClasses = {
    succeeded: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-rose-100 text-rose-800',
    running: 'bg-slate-100 text-slate-700',
  };

  protected readonly statusLabels = {
    succeeded: 'Succeeded',
    failed: 'Failed',
    running: 'Running',
  };

  protected readonly formatRelativeTime = formatRelativeTime;

  constructor() {
    // Picks up runs from pull requests opened while the page is open.
    interval(runsRefreshIntervalMs)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.runs.reload());
  }
}
