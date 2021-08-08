import { Routes } from '@angular/router';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';
import { AdminUploadComponent } from '../admin-upload/admin-upload.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminOverviewComponent,
  },
  {
    path: 'upload',
    component: AdminUploadComponent,
  },
  {
    path: ':id',
    component: AdminUploadComponent,
  },
];
