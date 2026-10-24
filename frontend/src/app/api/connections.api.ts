import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { AccessibleGithubRepository } from '@workflow-automation/shared';

@Injectable({ providedIn: 'root' })
export class ConnectionsApi {
  private readonly http = inject(HttpClient);

  listRepositories(connectionId: string): Observable<AccessibleGithubRepository[]> {
    return this.http.get<AccessibleGithubRepository[]>(
      `/api/connections/${connectionId}/repositories`,
    );
  }
}
