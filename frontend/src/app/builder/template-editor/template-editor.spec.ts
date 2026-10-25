import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { BuilderStore } from '../builder.store';
import { TemplateEditor } from './template-editor';

describe('TemplateEditor', () => {
  let store: BuilderStore;
  let element: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [TemplateEditor], providers: [BuilderStore] });
    store = TestBed.inject(BuilderStore);
    store.body.set('Thanks ');
    const fixture = TestBed.createComponent(TemplateEditor);
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  function clickChip(field: string): void {
    const chip = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === field,
    );
    chip?.click();
  }

  it('inserts the clicked field as a placeholder', () => {
    const textarea = element.querySelector('textarea')!;
    textarea.setSelectionRange(7, 7);
    clickChip('pr.author');
    expect(store.body()).toBe('Thanks {{pr.author}}');
  });
});
