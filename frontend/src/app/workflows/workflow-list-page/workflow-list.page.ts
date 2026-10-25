import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { Serialized, WorkflowListItem } from '@workflow-automation/shared';
import { apiErrorMessage } from '../../api/api-error-message';
import { CopilotBox } from '../../copilot/copilot-box/copilot-box';
import { WorkflowsApi } from '../../api/workflows.api';
import { toUpdateInput } from '../workflow-input';
import { WorkflowRow } from '../workflow-row/workflow-row';

@Component({
  selector: 'app-workflow-list-page',
  imports: [CopilotBox, RouterLink, WorkflowRow],
  templateUrl: './workflow-list.page.html',
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
