import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { Serialized, WorkflowListItem } from '@workflow-automation/shared';
import { apiErrorMessage } from '../api/api-error-message';
import { CopilotBox } from '../copilot/copilot-box';
import { WorkflowsApi } from '../api/workflows.api';
import { toUpdateInput } from './workflow-input';
import { WorkflowRow } from './workflow-row';

@Component({
  selector: 'app-workflow-list-page',
  imports: [CopilotBox, RouterLink, WorkflowRow],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Workflows</h1>
      <a
        routerLink="/workflows/new"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        New workflow
      </a>
    </div>

    <div class="mb-6">
      <app-copilot-box />
    </div>

    @if (actionError()) {
      <p role="alert" class="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
        {{ actionError() }}
      </p>
    }

    @if (workflows.isLoading() && !workflows.hasValue()) {
      <p class="text-slate-600">Loading…</p>
    } @else if (workflows.error()) {
      <p role="alert" class="text-rose-700">The workflows could not be loaded.</p>
    } @else if (workflows.value()?.length === 0) {
      <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">
        No workflows yet. Create one to comment on every pull request that is opened.
      </div>
    } @else {
      <ul class="flex flex-col gap-3">
        @for (workflow of workflows.value(); track workflow._id) {
          <li>
            <app-workflow-row
              [workflow]="workflow"
              [busy]="busyWorkflowId() === workflow._id"
              (toggled)="toggle(workflow)"
              (deleted)="remove(workflow)"
            />
          </li>
        }
      </ul>
    }
  `,
})
export class WorkflowListPage {
  private readonly api = inject(WorkflowsApi);

  protected readonly workflows = rxResource({ stream: () => this.api.list() });
  protected readonly busyWorkflowId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  protected toggle(workflow: Serialized<WorkflowListItem>): Promise<void> {
    return this.changeWorkflow(workflow, () =>
      firstValueFrom(this.api.update(workflow._id, toUpdateInput(workflow, !workflow.enabled))),
    );
  }

  protected remove(workflow: Serialized<WorkflowListItem>): Promise<void> {
    if (!confirm(`Delete "${workflow.name}"?`)) {
      return Promise.resolve();
    }
    return this.changeWorkflow(workflow, () => firstValueFrom(this.api.delete(workflow._id)));
  }

  private async changeWorkflow(
    workflow: Serialized<WorkflowListItem>,
    change: () => Promise<unknown>,
  ) {
    this.busyWorkflowId.set(workflow._id);
    this.actionError.set(null);
    try {
      await change();
      this.workflows.reload();
    } catch (error) {
      this.actionError.set(apiErrorMessage(error));
    } finally {
      this.busyWorkflowId.set(null);
    }
  }
}
