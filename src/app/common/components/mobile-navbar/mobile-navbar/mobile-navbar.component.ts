import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { $ } from 'protractor';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { DisposableComponent } from '../../disposable.component';

@Component({
  selector: 'app-mobile-navbar',
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.scss'],
})
export class MobileNavbarComponent
  extends DisposableComponent
  implements OnInit
{
  appState$: Observable<State>;

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    private readonly authService: AuthService
  ) {
    super();
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }

  ngOnDestroy() {
    this.appStateService.patchState({ sidenav: false });
  }

  toggleSidenav() {
    const currentSidenavState = this.appStateService.getStateSnapshot().sidenav;
    this.appStateService.patchState({ sidenav: !currentSidenavState });
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
