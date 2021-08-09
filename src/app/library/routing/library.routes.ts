import { Routes } from '@angular/router';
import { AdminGuard } from 'src/app/admin/routing/admin.guard';
import { HomeComponent } from '../components/home/home.component';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { LibraryGuard } from './library.guard';

export const LIBRARY_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [LibraryGuard],
    component: HomeComponent,
  },
  {
    path: 'admin',
    canLoad: [AdminGuard],
    loadChildren: () =>
      import('../../admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'pdf-viewer/:id',
    canActivate: [LibraryGuard],
    component: PdfViewerComponent,
  },
];
