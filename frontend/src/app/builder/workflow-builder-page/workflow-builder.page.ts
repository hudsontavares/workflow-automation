import { Component, inject, input, type OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../../api/api-error-message';
import { WorkflowsApi } from '../../api/workflows.api';
import { CopilotDraftStore } from '../../copilot/copilot-draft.store';
import { SessionStore } from '../../core/session.store';
import { ActionStep } from '../action-step/action-step';
import { BuilderStore } from '../builder.store';
import { TriggerStep } from '../trigger-step/trigger-step';
import { WorkflowRuns } from '../workflow-runs/workflow-runs';

@Component({
  selector: 'app-workflow-builder-page',
  imports: [ActionStep, RouterLink, TriggerStep, WorkflowRuns],
  providers: [BuilderStore],
  templateUrl: './workflow-builder.page.html',
})
export class WorkflowBuilderPage implements OnInit {
  readonly workflowId = input<string>();

  protected readonly store = inject(BuilderStore);
  private readonly session = inject(SessionStore);
  private readonly copilotDrafts = inject(CopilotDraftStore);
  private readonly workflowsApi = inject(WorkflowsApi);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly fromCopilot = signal(false);

  async ngOnInit(): Promise<void> {
    const workflowId = this.workflowId();
    if (!workflowId) {
      this.store.connectionId.set(this.session.githubConnectionId());
      const draft = this.copilotDrafts.take();
      if (draft) {
        this.store.loadDraft(draft);
        this.fromCopilot.set(true);
      }
      return;
    }
    try {
      this.store.load(await firstValueFrom(this.workflowsApi.get(workflowId)));
    } catch (error) {
      this.loadError.set(apiErrorMessage(error));
    }
  }

  protected async save(): Promise<void> {
    const workflowId = this.workflowId();
    this.saving.set(true);
    this.saveError.set(null);
    try {
      await firstValueFrom(
        workflowId
          ? this.workflowsApi.update(workflowId, this.store.toUpdateInput())
          : this.workflowsApi.create(this.store.toCreateInput()),
      );
      await this.router.navigate(['/workflows']);
    } catch (error) {
      this.saveError.set(apiErrorMessage(error));
    } finally {
      this.saving.set(false);
    }
  }
}
