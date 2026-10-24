import { Component, inject } from '@angular/core';

import { BuilderStore } from './builder.store';

@Component({
  selector: 'app-template-editor',
  template: `
    <label for="comment-template" class="mb-1 block text-sm font-medium">Comment</label>
    <textarea
      #templateField
      id="comment-template"
      rows="3"
      class="w-full rounded-md border border-slate-300 p-2 font-mono text-sm"
      [value]="store.body()"
      (input)="store.body.set(templateField.value)"
    ></textarea>

    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <span class="text-slate-600">Insert:</span>
      @for (field of store.outputFields(); track field) {
        <button
          type="button"
          class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs hover:bg-slate-200"
          (click)="insertField(field, templateField)"
        >
          {{ field }}
        </button>
      }
    </div>

    @for (error of store.templateErrors(); track error) {
      <p role="alert" class="mt-2 text-sm text-rose-700">{{ error }}</p>
    }

    <div class="mt-3 rounded-md bg-slate-100 p-3 text-sm">
      <p class="mb-1 text-xs font-medium uppercase text-slate-500">Preview</p>
      <p data-testid="template-preview">{{ store.preview() }}</p>
    </div>
  `,
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
