import { Component, computed, inject } from '@angular/core';

import { AppCatalog } from '@workflow-automation/shared';
import { AppPicker } from '../app-picker/app-picker';
import { BuilderStore } from '../builder.store';
import { TemplateEditor } from '../template-editor/template-editor';

@Component({
  selector: 'app-action-step',
  imports: [AppPicker, TemplateEditor],
  templateUrl: './action-step.html',
})
export class ActionStep {
  protected readonly store = inject(BuilderStore);

  protected readonly actions = computed(
    () => AppCatalog.find((app) => app.id === this.store.actionAppId())?.actions ?? [],
  );
}
