import { Routes } from '@angular/router';
import { AdminComponent } from '../admin/admin.component';
import { AdminUploadComponent } from '../adminUpload/adminUpload.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
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
