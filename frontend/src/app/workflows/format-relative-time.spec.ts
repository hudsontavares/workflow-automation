import { describe, expect, it } from 'vitest';

import { formatRelativeTime } from './format-relative-time';

const now = new Date('2026-10-24T12:00:00Z');

describe('formatRelativeTime', () => {
  it('says just now within the first minute', () => {
    expect(formatRelativeTime('2026-10-24T11:59:30Z', now)).toBe('just now');
  });

  it('counts minutes within the first hour', () => {
    expect(formatRelativeTime('2026-10-24T11:45:00Z', now)).toBe('15 min ago');
  });

  it('counts hours within the first day', () => {
    expect(formatRelativeTime('2026-10-24T09:00:00Z', now)).toBe('3 h ago');
  });
});
