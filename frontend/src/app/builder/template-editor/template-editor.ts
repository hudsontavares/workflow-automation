import { Component, inject } from '@angular/core';

import { BuilderStore } from '../builder.store';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.html',
})
export class TemplateEditor {
  protected readonly store = inject(BuilderStore);

  protected insertField(field: string, templateField: HTMLTextAreaElement): void {
    const placeholder = `{{${field}}}`;
    const body = this.store.body();
    const start = templateField.selectionStart ?? body.length;
    const end = templateField.selectionEnd ?? body.length;
    this.store.body.set(body.slice(0, start) + placeholder + body.slice(end));
    templateField.focus();
  }
}
