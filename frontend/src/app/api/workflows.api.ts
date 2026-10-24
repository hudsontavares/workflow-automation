import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  CreateWorkflowConfigurationInput,
  ExecutionSummary,
  Serialized,
  UpdateWorkflowConfigurationInput,
  WorkflowConfiguration,
  WorkflowListItem,
} from '@workflow-automation/shared';

@Injectable({ providedIn: 'root' })
export class WorkflowsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Serialized<WorkflowListItem>[]> {
    return this.http.get<Serialized<WorkflowListItem>[]>('/api/workflows');
  }

  get(workflowId: string): Observable<Serialized<WorkflowConfiguration>> {
    return this.http.get<Serialized<WorkflowConfiguration>>(`/api/workflows/${workflowId}`);
  }

  listRecentExecutions(workflowId: string): Observable<Serialized<ExecutionSummary>[]> {
    return this.http.get<Serialized<ExecutionSummary>[]>(`/api/workflows/${workflowId}/executions`);
  }

  create(input: CreateWorkflowConfigurationInput): Observable<Serialized<WorkflowConfiguration>> {
    return this.http.post<Serialized<WorkflowConfiguration>>('/api/workflows', input);
  }

  update(
    workflowId: string,
    input: UpdateWorkflowConfigurationInput,
  ): Observable<Serialized<WorkflowConfiguration>> {
    return this.http.put<Serialized<WorkflowConfiguration>>(`/api/workflows/${workflowId}`, input);
  }

  delete(workflowId: string): Observable<void> {
    return this.http.delete<void>(`/api/workflows/${workflowId}`);
  }
}
