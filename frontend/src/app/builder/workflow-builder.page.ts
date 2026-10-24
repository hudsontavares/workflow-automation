import { Component, inject, input, type OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../api/api-error-message';
import { WorkflowsApi } from '../api/workflows.api';
import { SessionStore } from '../core/session.store';
import { ActionStep } from './action-step';
import { BuilderStore } from './builder.store';
import { TriggerStep } from './trigger-step';

@Component({
  selector: 'app-workflow-builder-page',
  imports: [ActionStep, RouterLink, TriggerStep],
  providers: [BuilderStore],
  template: `
    <h1 class="mb-6 text-2xl font-semibold">
      {{ workflowId() ? 'Edit workflow' : 'New workflow' }}
    </h1>

    @if (loadError()) {
      <p role="alert" class="text-rose-700">{{ loadError() }}</p>
    } @else {
      <form class="flex flex-col gap-6" (submit)="$event.preventDefault(); save()">
        <section class="rounded-lg border border-slate-200 bg-white p-5">
          <app-trigger-step />
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-5">
          <app-action-step />
        </section>

        <section class="rounded-lg border border-slate-200 bg-white p-5">
          <label for="workflow-name" class="mb-1 block text-sm font-medium">Name</label>
          <input
            #nameField
            id="workflow-name"
            class="w-full rounded-md border border-slate-300 p-2 text-sm"
            placeholder="Thank pull request authors"
            [value]="store.name()"
            (input)="store.name.set(nameField.value)"
          />
          @if (!workflowId()) {
            <p class="mt-2 text-sm text-slate-600">
              New workflows start turned off; turn them on from the list.
            </p>
          }
        </section>

        @if (saveError()) {
          <p role="alert" class="rounded-md bg-rose-50 p-3 text-sm text-rose-800">
            {{ saveError() }}
          </p>
        }

        <div class="flex justify-end gap-2">
          <a routerLink="/workflows" class="rounded-md px-4 py-2 text-sm hover:bg-slate-100"
            >Cancel</a
          >
          <button
            type="submit"
            class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
            [disabled]="!store.canSave() || saving()"
          >
            {{ saving() ? 'Saving…' : 'Save' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class WorkflowBuilderPage implements OnInit {
  readonly workflowId = input<string>();

  protected readonly store = inject(BuilderStore);
  private readonly session = inject(SessionStore);
  private readonly workflowsApi = inject(WorkflowsApi);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const workflowId = this.workflowId();
    if (!workflowId) {
      this.store.connectionId.set(this.session.githubConnectionId());
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
