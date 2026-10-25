import { Component, input, output } from '@angular/core';

import { AppCatalog } from '@workflow-automation/shared';

@Component({
  selector: 'app-app-picker',
  templateUrl: './app-picker.html',
})
export class AppPicker {
  readonly label = input.required<string>();
  readonly selectedAppId = input.required<string>();
  readonly selected = output<string>();

  protected readonly apps = AppCatalog;
}
