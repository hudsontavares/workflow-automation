import { describe, expect, it } from 'vitest';

import {
  findTemplateFields,
  findUnknownTemplateFields,
  hasEmptyTemplatePlaceholder,
} from './template.js';

describe('findTemplateFields', () => {
  it('finds every field, with or without spaces inside the braces', () => {
    expect(findTemplateFields('Thanks @{{pr.author}} for "{{ pr.title }}"')).toEqual([
      'pr.author',
      'pr.title',
    ]);
  });

  it('finds nothing in plain text', () => {
    expect(findTemplateFields('Thanks!')).toEqual([]);
  });

  it('ignores empty placeholders', () => {
    expect(findTemplateFields('Hi {{ }} and {{}}')).toEqual([]);
  });
});

describe('hasEmptyTemplatePlaceholder', () => {
  it('detects a placeholder with only spaces', () => {
    expect(hasEmptyTemplatePlaceholder('Hi {{ }}')).toBe(true);
  });

  it('accepts a template whose placeholders all have a field', () => {
    expect(hasEmptyTemplatePlaceholder('Hi {{pr.author}}')).toBe(false);
  });
});

describe('findUnknownTemplateFields', () => {
  it('returns the fields the trigger does not output', () => {
    expect(
      findUnknownTemplateFields('{{pr.title}} by {{pr.reviewer}}', 'github.pull_request.opened'),
    ).toEqual(['pr.reviewer']);
  });

  it('returns nothing when every field is an output of the trigger', () => {
    expect(
      findUnknownTemplateFields(
        '{{pr.number}} {{pr.title}} {{pr.author}} {{pr.url}}',
        'github.pull_request.opened',
      ),
    ).toEqual([]);
  });
});
