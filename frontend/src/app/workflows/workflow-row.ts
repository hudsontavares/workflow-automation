import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  findCatalogTrigger,
  type Serialized,
  type WorkflowListItem,
} from '@workflow-automation/shared';
import { formatRelativeTime } from './format-relative-time';

@Component({
  selector: 'app-workflow-row',
  imports: [RouterLink],
  template: `
    <div class="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="workflow().enabled"
        [attr.aria-label]="(workflow().enabled ? 'Turn off ' : 'Turn on ') + workflow().name"
        [disabled]="busy()"
        class="relative h-6 w-11 shrink-0 rounded-full transition"
        [class]="workflow().enabled ? 'bg-emerald-500' : 'bg-slate-300'"
        (click)="toggled.emit()"
      >
        <span
          class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
          [class]="workflow().enabled ? 'left-5.5' : 'left-0.5'"
        ></span>
      </button>

      <div class="min-w-0 flex-1">
        <a [routerLink]="['/workflows', workflow()._id]" class="font-medium hover:underline">
          {{ workflow().name }}
        </a>
        <p class="truncate text-sm text-slate-600">
          {{ triggerLabel() }} on {{ workflow().trigger.repository.fullName }}
        </p>
      </div>

      <div class="text-right text-sm" data-testid="last-run">
        @if (workflow().lastExecution; as lastExecution) {
          @if (lastExecution.status === 'succeeded' && lastExecution.commentUrl) {
            <a
              [href]="lastExecution.commentUrl"
              target="_blank"
              rel="noopener"
              class="text-emerald-700 hover:underline"
            >
              Commented {{ lastRunTime() }}
            </a>
          } @else if (lastExecution.status === 'failed') {
            <span class="text-rose-700" [title]="lastExecution.errorMessage ?? ''"
              >Failed {{ lastRunTime() }}</span
            >
          } @else {
            <span class="text-slate-600">Running…</span>
          }
        } @else {
          <span class="text-slate-500">Never ran</span>
        }
      </div>

      <button
        type="button"
        class="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        [disabled]="busy()"
        (click)="deleted.emit()"
      >
        Delete
      </button>
    </div>
  `,
})
export class WorkflowRow {
  readonly workflow = input.required<Serialized<WorkflowListItem>>();
  readonly busy = input(false);
  readonly toggled = output();
  readonly deleted = output();

  protected readonly triggerLabel = computed(
    () => findCatalogTrigger(this.workflow().trigger.type)?.label ?? this.workflow().trigger.type,
  );
  protected readonly lastRunTime = computed(() => {
    const ranAt = this.workflow().lastExecution?.ranAt;
    return ranAt ? formatRelativeTime(ranAt) : '';
  });
}
