import { Injectable, signal } from '@angular/core';

import type { WorkflowDraft } from '@workflow-automation/shared';

/** Hands a Copilot draft from the workflow list to the builder it opens. */
@Injectable({ providedIn: 'root' })
export class CopilotDraftStore {
  private readonly pendingDraft = signal<WorkflowDraft | null>(null);

  hold(draft: WorkflowDraft): void {
    this.pendingDraft.set(draft);
  }

  take(): WorkflowDraft | null {
    const draft = this.pendingDraft();
    this.pendingDraft.set(null);
    return draft;
  }
}
