import { Routes } from '@angular/router';
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
    canLoad: [],
    loadChildren: () =>
      import('../components/admin-page/admin-page.module').then((m) => m.AdminPageModule),
  },
  {
    path: 'pdf-viewer/:id',
    canActivate: [LibraryGuard],
    component: PdfViewerComponent,
  },
];
