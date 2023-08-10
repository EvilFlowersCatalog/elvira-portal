import { Routes } from '@angular/router';
import { AdminGuard } from 'src/app/admin/routing/admin.guard';
import { AllEntriesComponent } from '../components/all-entries/allEntries.component';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { FavoritesComponent } from '../components/favorites/favorites.component';
import { AccountSettingsComponent } from '../components/account-settings/account-settings.component';
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
    path: 'feeds/:feedId',
    canActivate: [LibraryGuard],
    component: FeedsPageComponent,
  },
  {
    path: 'all-entries',
    canActivate: [LibraryGuard],
    component: AllEntriesComponent,
  },
  {
    path: 'pdf-viewer/:userAcquisitionID',
    canActivate: [LibraryGuard],
    component: PdfViewerComponent,
  },
  {
    path: 'favorites',
    canActivate: [LibraryGuard],
    component: FavoritesComponent,
  },
  {
    path: 'account',
    canActivate: [LibraryGuard],
    component: AccountSettingsComponent,
  },
];
