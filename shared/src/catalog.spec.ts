import { describe, expect, it } from 'vitest';

import { ActionSchema } from './actions.js';
import { AppCatalog } from './catalog.js';
import { TriggerSchema } from './triggers.js';

const unionTypes = (union: typeof TriggerSchema | typeof ActionSchema) =>
  union.def.options.map((option) => option.shape.type.def.values[0]).sort();

describe('AppCatalog', () => {
  it('lists exactly the trigger types the schemas accept', () => {
    const catalogTypes = AppCatalog.flatMap((app) => app.triggers.map((t) => t.type)).sort();
    expect(catalogTypes).toEqual(unionTypes(TriggerSchema));
  });

  it('lists exactly the action types the schemas accept', () => {
    const catalogTypes = AppCatalog.flatMap((app) => app.actions.map((a) => a.type)).sort();
    expect(catalogTypes).toEqual(unionTypes(ActionSchema));
  });

  it('gives no triggers or actions to apps that are coming soon', () => {
    const comingSoonSteps = AppCatalog.filter((app) => app.status === 'coming_soon').flatMap(
      (app) => [...app.triggers, ...app.actions],
    );
    expect(comingSoonSteps).toEqual([]);
  });
});
