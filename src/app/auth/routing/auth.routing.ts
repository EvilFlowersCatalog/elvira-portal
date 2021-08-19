import { Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { LandingPageComponent } from '../components/landing-page/landing-page.component';
import { LoginGuard } from './login.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [LoginGuard],
    component: LandingPageComponent,
  },
  {
    path: 'login',
    canActivate: [LoginGuard],
    component: LoginComponent,
  },
];
