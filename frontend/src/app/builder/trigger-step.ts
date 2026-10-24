import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AppCatalog } from '@workflow-automation/shared';
import { ConnectionsApi } from '../api/connections.api';
import { AppPicker } from './app-picker';
import { BuilderStore } from './builder.store';

@Component({
  selector: 'app-trigger-step',
  imports: [AppPicker],
  template: `
    <h2 class="mb-3 font-semibold">1. When this happens</h2>
    <app-app-picker
      label="Trigger app"
      [selectedAppId]="store.triggerAppId()"
      (selected)="store.triggerAppId.set($event)"
    />

    <fieldset class="mt-4">
      <legend class="mb-1 text-sm font-medium">Event</legend>
      @for (trigger of triggers(); track trigger.type) {
        <label class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="trigger"
            [checked]="trigger.type === store.triggerType()"
            (change)="store.triggerType.set(trigger.type)"
          />
          {{ trigger.label }}
        </label>
      }
    </fieldset>

    <label for="repository" class="mb-1 mt-4 block text-sm font-medium">Repository</label>
    @if (repositories.isLoading()) {
      <p class="text-sm text-slate-600">Loading your repositories…</p>
    } @else if (repositories.error()) {
      <p role="alert" class="text-sm text-rose-700">Your repositories could not be loaded.</p>
    } @else {
      <select
        #repositoryField
        id="repository"
        class="w-full rounded-md border border-slate-300 p-2 text-sm"
        (change)="selectRepository(repositoryField.value)"
      >
        <option value="" [selected]="!store.repository()">
          Choose a repository you administer
        </option>
        @for (repository of repositoryOptions(); track repository.id) {
          <option [value]="repository.id" [selected]="repository.id === store.repository()?.id">
            {{ repository.fullName }}
          </option>
        }
      </select>
    }
  `,
})
export class TriggerStep {
  protected readonly store = inject(BuilderStore);
  private readonly connectionsApi = inject(ConnectionsApi);

  protected readonly triggers = computed(
    () => AppCatalog.find((app) => app.id === this.store.triggerAppId())?.triggers ?? [],
  );

  protected readonly repositories = rxResource({
    params: () => this.store.connectionId() ?? undefined,
    stream: ({ params: connectionId }) => this.connectionsApi.listRepositories(connectionId),
  });

  // Keeps an edited workflow's repository selectable even if it is no longer in the list.
  protected readonly repositoryOptions = computed(() => {
    const listed = this.repositories.value() ?? [];
    const current = this.store.repository();
    return current && !listed.some((repository) => repository.id === current.id)
      ? [current, ...listed]
      : listed;
  });

  protected selectRepository(repositoryId: string): void {
    const repository = this.repositoryOptions().find(({ id }) => String(id) === repositoryId);
    this.store.repository.set(
      repository ? { id: repository.id, fullName: repository.fullName } : null,
    );
  }
}
