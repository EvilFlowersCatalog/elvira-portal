import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisposableComponent } from '../disposable.component';
import { State } from 'src/app/types/general.types';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AuthService } from 'src/app/services/auth.service';
import { AdvancedSearchDialogComponent } from '../advanced-search-dialog/advanced-search-dialog.component';

@Component({
  selector: 'app-mobile-sidenav',
  templateUrl: './mobile-sidenav.component.html',
  styleUrls: ['./mobile-sidenav.component.scss'],
})
export class MobileSidenavComponent
  extends DisposableComponent
  implements OnInit {
  appState$: Observable<State>; // used in html

  constructor(
    private readonly router: Router,
    public dialog: MatDialog,
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

  // Navigation for button
  navigate(link: string) {
    this.appStateService.patchState({ sidenav: false });
    this.router.navigate([link]);
  }

  // change theme
  changeTheme(theme: string) {
    this.appStateService.patchState({ theme: theme, sidenav: false });
  }

  // Change language
  changeLanguage(language: string) {
    this.appStateService.patchState({ lang: language, sidenav: false });
  }

  // Open advanced search
  openAdvanced() {
    this.appStateService.patchState({ sidenav: false });
    this.dialog.open(AdvancedSearchDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: {},
    });
  }

  // Closing sidebar
  hideSidenav() {
    this.appStateService.patchState({ sidenav: false });
  }

  logout() {
    this.appStateService.logoutResetState();
    this.router.navigate(['/auth/home']);
  }
}
