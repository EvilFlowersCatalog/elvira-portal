import { Routes } from '@angular/router';
import { AdminOverviewComponent } from '../components/admin-overview/admin-overview.component';
import { DocumentFormComponent } from '../components/document-form/document-form.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminOverviewComponent,
  },
  {
    path: 'upload',
    component: DocumentFormComponent,
  },
  {
    path: 'edit/:id',
    component: DocumentFormComponent,
  },
];
