import { findCatalogTrigger } from './catalog.js';
import type { TriggerType } from './triggers.js';

const templateFieldPattern = /\{\{\s*([^{}\s][^{}]*?)\s*\}\}/g;
const emptyTemplatePlaceholderPattern = /\{\{\s*\}\}/;

export function findTemplateFields(template: string): string[] {
  return [...template.matchAll(templateFieldPattern)].map((match) => match[1]);
}

export function hasEmptyTemplatePlaceholder(template: string): boolean {
  return emptyTemplatePlaceholderPattern.test(template);
}

export function findUnknownTemplateFields(template: string, triggerType: TriggerType): string[] {
  const outputFields = findCatalogTrigger(triggerType)?.outputFields ?? [];
  return findTemplateFields(template).filter((field) => !outputFields.includes(field));
}

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(templateFieldPattern, (_placeholder, field: string) =>
    String(data[field] ?? ''),
  );
}
