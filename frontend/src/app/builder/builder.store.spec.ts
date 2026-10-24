import { describe, expect, it } from 'vitest';

import { BuilderStore } from './builder.store';

function completeStore(): BuilderStore {
  const store = new BuilderStore();
  store.name.set('Thank PR authors');
  store.connectionId.set('6f0c2c7e-3b1a-4b8e-9a51-0d6c5f2b8a11');
  store.repository.set({ id: 1, fullName: 'octocat/hello-world' });
  return store;
}

describe('BuilderStore', () => {
  it('offers the output fields of the selected trigger', () => {
    expect(new BuilderStore().outputFields()).toEqual([
      'pr.number',
      'pr.title',
      'pr.author',
      'pr.url',
    ]);
  });

  it('reports a template field the trigger does not output', () => {
    const store = completeStore();
    store.body.set('Reviewed by {{pr.reviewer}}');
    expect(store.templateErrors()).toEqual(['Unknown template fields: pr.reviewer']);
  });

  it('reports an empty placeholder', () => {
    const store = completeStore();
    store.body.set('Thanks {{ }}');
    expect(store.templateErrors()).toEqual(['Template placeholders cannot be empty']);
  });

  it('previews the comment with sample pull request data', () => {
    const store = completeStore();
    store.body.set('Thanks @{{pr.author}} for #{{pr.number}}');
    expect(store.preview()).toBe('Thanks @octocat for #42');
  });

  it('cannot save without a repository', () => {
    const store = completeStore();
    store.repository.set(null);
    expect(store.canSave()).toBe(false);
  });

  it('can save once name, repository and a valid template are set', () => {
    expect(completeStore().canSave()).toBe(true);
  });

  it('builds the create input the API expects', () => {
    const store = completeStore();
    store.body.set('Thanks!');
    expect(store.toCreateInput()).toEqual({
      name: 'Thank PR authors',
      trigger: {
        type: 'github.pull_request.opened',
        connectionId: '6f0c2c7e-3b1a-4b8e-9a51-0d6c5f2b8a11',
        repository: { id: 1, fullName: 'octocat/hello-world' },
      },
      action: {
        type: 'github.pull_request.comment',
        connectionId: '6f0c2c7e-3b1a-4b8e-9a51-0d6c5f2b8a11',
        body: 'Thanks!',
      },
    });
  });

  it('keeps the on/off state of an edited workflow', () => {
    const store = completeStore();
    store.enabled.set(true);
    expect(store.toUpdateInput().enabled).toBe(true);
  });
});
