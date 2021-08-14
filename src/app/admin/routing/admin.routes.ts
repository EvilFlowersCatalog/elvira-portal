import { Routes } from '@angular/router';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';
import { AdminUploadComponent } from '../admin-upload/admin-upload.component';
import { FeedsOverviewComponent } from '../feeds-overview/feeds-overview.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminOverviewComponent,
  },
  {
    path: 'feeds',
    component: FeedsOverviewComponent,
  },
  {
    path: 'upload',
    component: AdminUploadComponent,
  },
  {
    path: ':id',
    component: AdminUploadComponent,
  }
];
