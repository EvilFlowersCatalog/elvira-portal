import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { DisposableComponent } from '../../disposable.component';

@Component({
  selector: 'app-mobile-sidenav',
  templateUrl: './mobile-sidenav.component.html',
  styleUrls: ['./mobile-sidenav.component.scss'],
})
export class MobileSidenavComponent
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
