import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject, Subscription } from 'rxjs';
import {
  concatMap,
  startWith,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MediaObserver } from '@angular/flex-layout';
import { Entry } from 'src/app/types/entry.types';
import { EntryService } from 'src/app/services/entry.service';
import { FeedService } from 'src/app/services/feed.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Filters } from 'src/app/types/general.types';

@Component({
  selector: 'app-all-entries',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent extends DisposableComponent implements OnInit {
  entries: Entry[] = []; // used in html
  results_length = 0; // used in html
  fetchEntries$ = new Subject();
  filters = new Filters(); // used in html
  show_filters: boolean = false; // used in html
  feed_name: string = ""; // used in html
  routeSubscription: Subscription;
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly entryService: EntryService,
    private readonly feedService: FeedService,
    private readonly route: ActivatedRoute,
    public mediaObserver: MediaObserver,
    private readonly router: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const filters = params.get('filters');
      this.getFilters(filters); // Reload your data based on the updated filters value
    });
    window.onbeforeunload = () => this.ngOnDestroy();

    // For dinamic changes
    this.fetchEntries$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() => this.entryService.getEntriesList({
          page: this.paginator?.pageIndex ?? 0,
          limit: this.paginator?.pageSize ?? 15,
          title: this.filters.title,
          feed_id: this.filters.feed,
          author: this.filters.author
        }))
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.results_length = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      });
  }

  // Paginator handling
  handlePageChange() {
    this.fetchEntries$.next();
  }

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

  getFilters(url_filters: string) {
    const params_array = url_filters.split('&');

    // Initialize an object to store the extracted values
    const extracted_values = {};

    // Loop through the array and extract parameter-value pairs
    params_array.forEach(param => {
      const [key, value] = param.split('=');
      extracted_values[key] = value;
    });

    this.filters.title = extracted_values["title"] ?? '';

    this.filters.feed = extracted_values["feed"] ?? '';
    if (this.filters.feed) {
      this.getFeedName(this.filters.feed);
    }
    else {
      this.feed_name = '';
    }

    this.filters.author = extracted_values["author"] ?? '';

    this.fetchEntries$.next();
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
}
