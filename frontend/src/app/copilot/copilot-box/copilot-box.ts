import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../../api/api-error-message';
import { CopilotApi } from '../../api/copilot.api';
import { CopilotDraftStore } from '../copilot-draft.store';

@Component({
  selector: 'app-copilot-box',
  templateUrl: './copilot-box.html',
})
export class CopilotBox {
  private readonly copilotApi = inject(CopilotApi);
  private readonly drafts = inject(CopilotDraftStore);
  private readonly router = inject(Router);

  protected readonly drafting = signal(false);
  protected readonly unsupportedReason = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected async draft(prompt: string): Promise<void> {
    if (!prompt.trim()) {
      return;
    }
    this.drafting.set(true);
    this.unsupportedReason.set(null);
    this.errorMessage.set(null);
    try {
      const response = await firstValueFrom(this.copilotApi.draft({ prompt }));
      if (response.status === 'unsupported') {
        this.unsupportedReason.set(response.reason);
        return;
      }
      this.drafts.hold(response.draft);
      await this.router.navigate(['/workflows/new']);
    } catch (error) {
      this.errorMessage.set(apiErrorMessage(error));
    } finally {
      this.drafting.set(false);
    }
  }
}
