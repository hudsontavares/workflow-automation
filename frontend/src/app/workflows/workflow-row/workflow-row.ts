import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  findCatalogTrigger,
  type Serialized,
  type WorkflowListItem,
} from '@workflow-automation/shared';
import { formatRelativeTime } from '../format-relative-time';

@Component({
  selector: 'app-workflow-row',
  imports: [RouterLink],
  templateUrl: './workflow-row.html',
})
export class WorkflowRow {
  readonly workflow = input.required<Serialized<WorkflowListItem>>();
  readonly busy = input(false);
  readonly toggled = output();
  readonly deleted = output();

  protected readonly triggerLabel = computed(
    () => findCatalogTrigger(this.workflow().trigger.type)?.label ?? this.workflow().trigger.type,
  );
  protected readonly lastRunTime = computed(() => {
    const ranAt = this.workflow().lastExecution?.ranAt;
    return ranAt ? formatRelativeTime(ranAt) : '';
  });
}
