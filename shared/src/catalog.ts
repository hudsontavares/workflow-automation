import type { ActionType } from './actions.js';
import type { TriggerType } from './triggers.js';

export interface CatalogTrigger {
  type: TriggerType;
  label: string;
  outputFields: readonly string[];
}

export interface CatalogAction {
  type: ActionType;
  label: string;
}

export type CatalogAppStatus = 'available' | 'coming_soon';

export interface CatalogApp {
  id: string;
  name: string;
  status: CatalogAppStatus;
  triggers: readonly CatalogTrigger[];
  actions: readonly CatalogAction[];
}

export const AppCatalog: readonly CatalogApp[] = [
  {
    id: 'github',
    name: 'GitHub',
    status: 'available',
    triggers: [
      {
        type: 'github.pull_request.opened',
        label: 'Pull request opened',
        outputFields: ['pr.number', 'pr.title', 'pr.author', 'pr.url'],
      },
    ],
    actions: [{ type: 'github.pull_request.comment', label: 'Comment on the pull request' }],
  },
  { id: 'gitlab', name: 'GitLab', status: 'coming_soon', triggers: [], actions: [] },
  { id: 'bitbucket', name: 'Bitbucket', status: 'coming_soon', triggers: [], actions: [] },
  { id: 'jira', name: 'Jira', status: 'coming_soon', triggers: [], actions: [] },
  { id: 'linear', name: 'Linear', status: 'coming_soon', triggers: [], actions: [] },
  { id: 'slack', name: 'Slack', status: 'coming_soon', triggers: [], actions: [] },
];

export function findCatalogTrigger(type: TriggerType): CatalogTrigger | undefined {
  return AppCatalog.flatMap((app) => app.triggers).find((trigger) => trigger.type === type);
}
