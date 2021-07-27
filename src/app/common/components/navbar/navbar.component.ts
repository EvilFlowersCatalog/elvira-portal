import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService } from '../../services/app-state/app-state.service';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { State } from '../../services/app-state/app-state.types';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DisposableComponent } from '../disposable.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends DisposableComponent implements OnInit {
  appState$: Observable<State>;

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    private readonly authService: AuthService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }

  changeTheme(theme: string) {
    this.appStateService.patchState({ theme: theme });
  }

  changeLanguage(language: string) {
    this.appStateService.patchState({ lang: language });
  }

  logout() {
    this.authService.logout(this.appStateService.getStateSnapshot().token);
    this.appStateService.patchState({
      token: null,
      username: null,
      isLoggedIn: false,
      isAdmin: false,
    });
    this.router.navigate(['/auth/login']);
  }
}
