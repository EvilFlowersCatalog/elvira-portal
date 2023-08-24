import { Routes } from '@angular/router';
import { AdminGuard } from 'src/app/admin/routing/admin.guard';
import { LibraryComponent } from '../components/library/library.component';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { FavoritesComponent } from '../components/favorites/favorites.component';
import { LibraryGuard } from './library.guard';
import { HomeComponent } from '../components/home/home.component';
import { FeedsPageComponent } from '../components/feeds-page/feeds-page.component';

export const LIBRARY_ROUTES: Routes = [
  {
    path: 'admin',
    canLoad: [AdminGuard],
    loadChildren: () =>
      import('../../admin/admin.module').then((m) => m.AdminModule),
  },
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
    path: 'feeds',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'feeds/:feed_id',
    canActivate: [LibraryGuard],
    component: FeedsPageComponent,
  },
  {
    path: 'library',
    canActivate: [LibraryGuard],
    component: LibraryComponent,
  },
  {
    path: 'pdf-viewer/:user_acquisition_id',
    canActivate: [LibraryGuard],
    component: PdfViewerComponent,
  },
  {
    path: 'favorites',
    canActivate: [LibraryGuard],
    component: FavoritesComponent,
  },
];
