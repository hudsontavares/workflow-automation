import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import type { Serialized, WorkflowListItem } from '@workflow-automation/shared';
import { WorkflowRow } from './workflow-row';

const workflow: Serialized<WorkflowListItem> = {
  _id: '0b7c6f8e-1d2a-4c3b-8e5f-6a7b8c9d0e1f',
  userId: '1c8d7a9f-2e3b-4d4c-9f6a-7b8c9d0e1f2a',
  name: 'Thank PR authors',
  enabled: false,
  trigger: {
    type: 'github.pull_request.opened',
    connectionId: '2d9e8b0a-3f4c-4e5d-8a7b-8c9d0e1f2a3b',
    repository: { id: 1, fullName: 'octocat/hello-world' },
    hookId: null,
  },
  action: {
    type: 'github.pull_request.comment',
    connectionId: '2d9e8b0a-3f4c-4e5d-8a7b-8c9d0e1f2a3b',
    body: 'Thanks!',
  },
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
  deletedAt: null,
  lastExecution: null,
};

async function renderRow(item = workflow) {
  TestBed.configureTestingModule({ imports: [WorkflowRow], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(WorkflowRow);
  fixture.componentRef.setInput('workflow', item);
  await fixture.whenStable();
  return fixture;
}

describe('WorkflowRow', () => {
  it('asks to toggle the workflow when the switch is clicked', async () => {
    const fixture = await renderRow();
    let toggles = 0;
    fixture.componentInstance.toggled.subscribe(() => toggles++);
    fixture.nativeElement.querySelector('[role="switch"]').click();
    expect(toggles).toBe(1);
  });

  it('says when a workflow never ran', async () => {
    const fixture = await renderRow();
    expect(fixture.nativeElement.querySelector('[data-testid="last-run"]').textContent.trim()).toBe(
      'Never ran',
    );
  });
});
