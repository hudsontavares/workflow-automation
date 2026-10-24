import { Component, input, output } from '@angular/core';

import { AppCatalog } from '@workflow-automation/shared';

@Component({
  selector: 'app-app-picker',
  template: `
    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-3"
      role="radiogroup"
      [attr.aria-label]="label()"
    >
      @for (app of apps; track app.id) {
        <button
          type="button"
          role="radio"
          [attr.aria-checked]="app.id === selectedAppId()"
          [disabled]="app.status === 'coming_soon'"
          class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm"
          [class]="
            app.id === selectedAppId()
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white disabled:cursor-not-allowed disabled:text-slate-400'
          "
          (click)="selected.emit(app.id)"
        >
          {{ app.name }}
          @if (app.status === 'coming_soon') {
            <span class="text-xs">Coming soon</span>
          }
        </button>
      }
    </div>
  `,
})
export class AppPicker {
  readonly label = input.required<string>();
  readonly selectedAppId = input.required<string>();
  readonly selected = output<string>();

  protected readonly apps = AppCatalog;
}
