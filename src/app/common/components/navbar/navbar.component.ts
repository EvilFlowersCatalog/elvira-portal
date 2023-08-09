import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { State } from '../../types/app-state.types';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DisposableComponent } from '../disposable.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends DisposableComponent implements OnInit {
  appState$: Observable<State>;
  theme: boolean;
  public href: string = "";

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService
  ) {
    super();
    this.router.events.subscribe(() => {
      this.href = window.location.pathname;
  });
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
    this.href = window.location.pathname;
    this.appState$.subscribe((state) => this.theme = state.theme === 'dark' ? true : false);
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }

  changeTheme() {
    this.theme = !this.theme;
    const theme = this.theme ? 'dark' : 'light';
    this.appStateService.patchState({ theme: theme });
  }

  changeLanguage(language: string) {
    this.appStateService.patchState({ lang: language });
  }

  logout() {
    this.appStateService.logoutResetState();
    this.router.navigate(['/auth']);
  }
}
