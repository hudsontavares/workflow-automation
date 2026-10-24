import type { Routes } from '@angular/router';

import { WorkflowBuilderPage } from './builder/workflow-builder.page';
import { signedInGuard } from './core/signed-in.guard';
import { SignInPage } from './sign-in/sign-in.page';
import { WorkflowListPage } from './workflows/workflow-list.page';

export const routes: Routes = [
  { path: 'sign-in', component: SignInPage },
  { path: 'workflows', component: WorkflowListPage, canActivate: [signedInGuard] },
  { path: 'workflows/new', component: WorkflowBuilderPage, canActivate: [signedInGuard] },
  { path: 'workflows/:workflowId', component: WorkflowBuilderPage, canActivate: [signedInGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'workflows' },
  { path: '**', redirectTo: 'workflows' },
];
