import { Routes } from '@angular/router';
import { AdminComponent } from '../components/admin/admin.component';
import { HomeComponent } from '../components/home/home.component';
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
      canActivate: [LibraryGuard],
      component: AdminComponent
  }
  ];
