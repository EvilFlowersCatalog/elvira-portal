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
import { Md5 } from 'ts-md5';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { FeedService } from 'src/app/services/feed.service';

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
  show_filters: boolean = false; // used in html
  feed_name: string = ''; // used in html
  routeSubscription: Subscription;
  filters = new Filters();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly navigationService: NavigationService,
    private readonly feedService: FeedService,
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    // If we are at library, update filter
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.toString().includes("/elvira/library/")) {
          // if we are in libarary, get filters
          const filters = event.url.toString().substring(event.url.toString().indexOf('title')).replace(/%3D/g, '=');
          this.getFilters(filters);
        }
      }
    });

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
    this.navigationService.modifiedNavigation(`elvira/library/${this.filters.getFilters()}`, event);
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
      width: '700px',
      maxWidth: '95%',
      data: { filters: this.filters },
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (result: 'no' & { title: string; author: string; from: string, to: string }) =>
            result !== 'no'
        ),
        map((result) => (
          this.filters.title = result.title,
          this.filters.author = result.author
        ))
      )
      .subscribe(() => {
        this.navigate(`elvira/library/${this.filters.getFilters()}`, null);
      });
  }

  // Submit... clear search input and navigate
  submit() {
    if (this.search_form?.value.search_input) {
      const title = this.search_form.value.search_input;
      this.filters.title = title;
      this.search_form.controls['search_input'].reset();
      this.navigate(`elvira/library/${this.filters.getFilters()}`, null);
    }
  }


  // FILTER funcs
  // Name of used feed
  getFeedName(feedId: string) {
    this.feedService.getFeedDetail(feedId)
      .subscribe((data) => this.feed_name = data.response.title);
  }

  // Removing filters
  removeFilter(type: string) {
    if (type === "title") {
      this.filters.title = '';
    } else if (type === "feed") {
      this.filters.feed = '';
      this.feed_name = ''; // do not forget name
    } else if (type === "author") {
      this.filters.author = '';
    }
    this.router.navigateByUrl(`/elvira/library/${this.filters.getFilters()}`);
  }

  clearFilter() {
    if (this.filters.title || this.filters.author || this.filters.feed) {
      this.filters.title = '';
      this.filters.feed = '';
      this.feed_name = '';
      this.filters.author = '';
      this.show_filters = false;
      this.router.navigateByUrl(`/elvira/library/${this.filters.getFilters()}`);
    }
  }

  getFilters(url_filters: string) {
    const params_array = url_filters.split('&');

    // Initialize an object to store the extracted values
    const extracted_values = {};

    // Loop through the array and extract parameter-value pairs
    params_array.forEach(param => {
      const [key, value] = param.split('=');
      extracted_values[key] = value;
    });

    this.filters.title = decodeURIComponent(extracted_values["title"]) ?? '';
    this.filters.feed = extracted_values["feed"] ?? '';
    if (this.filters.feed) {
      this.getFeedName(this.filters.feed);
    } else {
      this.feed_name = '';
    }
    this.filters.author = decodeURIComponent(extracted_values["author"]) ?? '';
  }
}
