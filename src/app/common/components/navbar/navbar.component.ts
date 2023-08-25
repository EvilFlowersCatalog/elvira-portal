import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisposableComponent } from '../disposable.component';
import { Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Filters, State } from 'src/app/types/general.types';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { AdvancedSearchDialogComponent } from '../advanced-search-dialog/advanced-search-dialog.component';
import { Md5 } from 'ts-md5';
import { NavigationService } from 'src/app/services/general/navigation.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends DisposableComponent implements OnInit {
  appState$: Observable<State>;
  theme: boolean; // used in html
  search_form: UntypedFormGroup; // used in html
  avatar_url: string; // used in html

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly navigationService: NavigationService
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
    this.appState$.subscribe((state) => this.theme = state.theme === 'dark' ? true : false);

    const email = '';
    const email_hash = Md5.hashStr(email.trim().toLowerCase());
    const gravatar_url = 'https://www.gravatar.com/avatar/';
    this.avatar_url = `${gravatar_url}${email_hash}`;
  }

  // Navigation for button
  navigate(link: string, event: any) {
    this.navigationService.modifiedNavigation(link, event);
  }

  navigateToLibrary(event: any) {
    // empty filters
    this.navigationService.modifiedNavigation(`elvira/library/${new Filters().getFilters()}`, event);
  }

  goToSTU(event: any) {
    event.preventDefault();
    window.open('https://www.fiit.stuba.sk/', '_blank');
  }

  // Changing theme
  changeTheme() {
    // Setting for animating button for themes
    this.theme = !this.theme;
    const theme = this.theme ? 'dark' : 'light';
    this.appStateService.patchState({ theme: theme });
  }

  // Change language
  changeLanguage(language: string) {
    this.appStateService.patchState({ lang: language });
  }

  // Logout
  logout() {
    this.appStateService.logoutResetState();
    this.router.navigate(['/auth/home']);
  }

  openAdvanced() {
    this.dialog.open(AdvancedSearchDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: {},
    });
  }

  // Submit... clear search input and navigate
  submit() {
    if (this.search_form?.value.search_input) {
      const title = this.search_form.value.search_input;
      this.search_form.controls['search_input'].reset();
      this.navigate(`elvira/library/${new Filters(title).getFilters()}`, null);
    }
  }
}
