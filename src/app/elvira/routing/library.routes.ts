import { Routes } from '@angular/router';
import { AdminGuard } from 'src/app/admin/routing/admin.guard';
import { LibraryComponent } from '../components/library/library.component';
import { PdfViewerComponent } from '../components/pdf-viewer/pdf-viewer.component';
import { FavoritesComponent } from '../components/favorites/favorites.component';
import { LibraryGuard } from './library.guard';
import { HomeComponent } from '../components/home/home.component';
import { FeedsPageComponent } from '../components/feeds-page/feeds-page.component';
import { AboutProjectComponent } from '../components/footer-components/about-project/about-project.component';
import { ReaderSettingsComponent } from '../components/footer-components/reader-settings/reader-settings.component';
import { ChangeLogComponent } from '../components/footer-components/change-log/change-log.component';

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
    path: 'library/:filters',
    canActivate: [LibraryGuard],
    component: LibraryComponent,
  },
  {
    path: 'pdf-viewer/:entry_id',
    canActivate: [LibraryGuard],
    component: PdfViewerComponent,
  },
  {
    path: 'favorites',
    canActivate: [LibraryGuard],
    component: FavoritesComponent,
  },
  {
    path: 'about-project',
    canActivate: [LibraryGuard],
    component: AboutProjectComponent,
  },
  {
    path: 'reader-settings',
    canActivate: [LibraryGuard],
    component: ReaderSettingsComponent,
  },
  {
    path: 'change-log',
    canActivate: [LibraryGuard],
    component: ChangeLogComponent,
  }
];
