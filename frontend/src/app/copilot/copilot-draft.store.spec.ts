import { describe, expect, it } from 'vitest';

import { CopilotDraftStore } from './copilot-draft.store';

const draft = {
  name: 'Thank PR authors',
  triggerType: 'github.pull_request.opened',
  actionType: 'github.pull_request.comment',
  repository: null,
  body: 'Thanks!',
} as const;

describe('CopilotDraftStore', () => {
  it('hands over the held draft', () => {
    const store = new CopilotDraftStore();
    store.hold(draft);
    expect(store.take()).toEqual(draft);
  });

  it('hands a draft over only once', () => {
    const store = new CopilotDraftStore();
    store.hold(draft);
    store.take();
    expect(store.take()).toBeNull();
  });
});
