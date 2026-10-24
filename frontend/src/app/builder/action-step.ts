import { Component, computed, inject } from '@angular/core';

import { AppCatalog } from '@workflow-automation/shared';
import { AppPicker } from './app-picker';
import { BuilderStore } from './builder.store';
import { TemplateEditor } from './template-editor';

@Component({
  selector: 'app-action-step',
  imports: [AppPicker, TemplateEditor],
  template: `
    <h2 class="mb-3 font-semibold">2. Do this</h2>
    <app-app-picker
      label="Action app"
      [selectedAppId]="store.actionAppId()"
      (selected)="store.actionAppId.set($event)"
    />

    <fieldset class="mt-4">
      <legend class="mb-1 text-sm font-medium">Action</legend>
      @for (action of actions(); track action.type) {
        <label class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="action"
            [checked]="action.type === store.actionType()"
            (change)="store.actionType.set(action.type)"
          />
          {{ action.label }}
        </label>
      }
    </fieldset>

    <div class="mt-4">
      <app-template-editor />
    </div>
  `,
})
export class ActionStep {
  protected readonly store = inject(BuilderStore);

  protected readonly actions = computed(
    () => AppCatalog.find((app) => app.id === this.store.actionAppId())?.actions ?? [],
  );
}
