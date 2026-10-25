import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiErrorMessage } from '../api/api-error-message';
import { CopilotApi } from '../api/copilot.api';
import { CopilotDraftStore } from './copilot-draft.store';

@Component({
  selector: 'app-copilot-box',
  template: `
    <form
      class="rounded-lg border border-slate-200 bg-white p-4"
      (submit)="$event.preventDefault(); draft(promptField.value)"
    >
      <label for="copilot-prompt" class="mb-1 block text-sm font-medium">
        Describe a workflow and let the Copilot draft it
      </label>
      <div class="flex gap-2">
        <input
          #promptField
          id="copilot-prompt"
          class="min-w-0 flex-1 rounded-md border border-slate-300 p-2 text-sm"
          placeholder="When a pull request is opened, comment thanks"
          maxlength="500"
          [disabled]="drafting()"
        />
        <button
          type="submit"
          class="rounded-md border border-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400"
          [disabled]="drafting()"
        >
          {{ drafting() ? 'Drafting…' : 'Draft' }}
        </button>
      </div>
      @if (unsupportedReason()) {
        <p role="status" class="mt-2 text-sm text-slate-700">{{ unsupportedReason() }}</p>
      }
      @if (errorMessage()) {
        <p role="alert" class="mt-2 text-sm text-rose-700">{{ errorMessage() }}</p>
      }
    </form>
  `,
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
