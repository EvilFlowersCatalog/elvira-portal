import { Component, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from '../disposable.component';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Filters, State } from 'src/app/types/general.types';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { AdvancedSearchDialogComponent } from '../advanced-search-dialog/advanced-search-dialog.component';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { FeedService } from 'src/app/services/feed.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends DisposableComponent implements OnInit {
  appState$: Observable<State>; // used in html
  theme: boolean; // used in html
  search_form: UntypedFormGroup; // used in html
  avatar_url: string; // used in html
  feed_name: string = ''; // used in html
  routeSubscription: Subscription;
  name: string = '';
  activeButton: number;
  dirName: string = '';

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly navigationService: NavigationService,
    private readonly feedService: FeedService
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.dirName = `../../../../assets/${environment.assetDirName}/logo.png`;
    // Set active button
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.toString().includes('/elvira/home')) {
          // HOME
          this.activeButton = 1;
        } else if (event.toString().includes('/elvira/library')) {
          // LIBRARY
          this.activeButton = 2;
        } else if (event.toString().includes('/elvira/my-shelf')) {
          // MY SHELF
          this.activeButton = 3;
        } else if (event.toString().includes('/elvira/admin')) {
          // ADMIN
          this.activeButton = 4;
        }
      }
    });

    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
    this.appState$.subscribe((state) => {
      this.theme = state.theme === 'dark' ? true : false;

      if (state?.username) {
        if (state.username[0].toLocaleLowerCase() === 'x') {
          this.name = state.username[1] + ' ' + state.username[2];
        } else {
          this.name = state.username[0] + ' ' + state.username[1];
        }
      }
    });
  }

  // Navigation for button
  navigate(link: string, event: any) {
    this.navigationService.modifiedNavigation(link, event);
  }

  navigateToLibrary(event: any) {
    // empty filters
    this.navigationService.modifiedNavigation(
      `elvira/library/${new Filters().getFilters()}`,
      event
    );
  }

  goToSTU() {
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
    const dialogRef = this.dialog.open(AdvancedSearchDialogComponent, {
      width: '500px',
      maxWidth: '95%',
    });
    let filters: Filters;

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (
            result: 'no' & {
              title: string;
              author: string;
              fromYear: string;
              fromMonth: string;
              fromDay: string;
              toYear: string;
              toMonth: string;
              toDay: string;
            }
          ) => result !== 'no' && result !== undefined
        ),
        map(
          (result) =>
            (filters = new Filters(
              result.title,
              result.author,
              '',
              [result.fromYear, result.fromMonth, result.fromDay],
              [result.toYear, result.toMonth, result.toDay]
            ))
        )
      )
      .subscribe(() => {
        this.navigate(`elvira/library/${filters.getFilters()}`, null);
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

  // FILTER funcs
  // Name of used feed
  getFeedName(feedId: string) {
    this.feedService
      .getFeedDetail(feedId)
      .subscribe((data) => (this.feed_name = data.response.title));
  }
}
