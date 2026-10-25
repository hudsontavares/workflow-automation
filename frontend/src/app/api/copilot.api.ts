import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { CopilotDraftRequest, CopilotDraftResponse } from '@workflow-automation/shared';

@Injectable({ providedIn: 'root' })
export class CopilotApi {
  private readonly http = inject(HttpClient);

  draft(request: CopilotDraftRequest): Observable<CopilotDraftResponse> {
    return this.http.post<CopilotDraftResponse>('/api/copilot/drafts', request);
  }
}
