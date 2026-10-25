import { Component, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

import { WorkflowsApi } from '../../api/workflows.api';
import { formatRelativeTime } from '../../workflows/format-relative-time';

export const runsRefreshIntervalMs = 10_000;

@Component({
  selector: 'app-workflow-runs',
  templateUrl: './workflow-runs.html',
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
