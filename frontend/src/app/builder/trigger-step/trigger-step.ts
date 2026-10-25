import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { AppCatalog } from '@workflow-automation/shared';
import { ConnectionsApi } from '../../api/connections.api';
import { AppPicker } from '../app-picker/app-picker';
import { BuilderStore } from '../builder.store';

@Component({
  selector: 'app-trigger-step',
  imports: [AppPicker],
  templateUrl: './trigger-step.html',
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
