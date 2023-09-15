import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject } from 'rxjs';
import {
  concatMap,
  filter,
  map,
  startWith,
  take,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MediaObserver } from '@angular/flex-layout';
import { Entry } from 'src/app/types/entry.types';
import { EntryService } from 'src/app/services/entry.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Filters } from 'src/app/types/general.types';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';

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
  private orderBy: string = 'title';
  @ViewChild('paginator') paginator: MatPaginator;

  // buttons used in html, in tools
  buttons: {
    title: string;
    icon: string;
    class: string;
    toolTip: string;
    active: boolean;
    onClick: () => void;
  }[] = [
    {
      title: '',
      icon: 'filter_list',
      class: 'library-tools-filter-button',
      toolTip: 'lazy.library.filtersToolTip',
      active: false,
      onClick: () => this.openFilters(),
    },
    {
      title: 'a-Z',
      icon: 'sort',
      class: 'library-tools-button',
      toolTip: 'lazy.library.aZToolTip',
      active: true,
      onClick: () => this.sort('title', this.buttons[1].title),
    },
    {
      title: 'z-A',
      icon: 'sort',
      class: 'library-tools-button',
      toolTip: 'lazy.library.zAToolTip',
      active: false,
      onClick: () => this.sort('-title', this.buttons[2].title),
    },
    {
      title: 'ASC',
      icon: '',
      class: 'library-tools-button',
      toolTip: 'lazy.library.ASCToolTip',
      active: false,
      onClick: () => this.sort('created_at', this.buttons[3].title),
    },
    {
      title: 'DE\nSC',
      icon: '',
      class: 'library-tools-button',
      toolTip: 'lazy.library.DESCToolTip',
      active: false,
      onClick: () => this.sort('-created_at', this.buttons[4].title),
    },
  ];

  constructor(
    private readonly entryService: EntryService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public mediaObserver: MediaObserver,
    public dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const filters = params.get('filters');
      this.getFilters(filters); // Reload data based on the updated filters value
    });
    window.onbeforeunload = () => this.ngOnDestroy();

    // For dinamic changes
    this.fetchEntries$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() =>
          this.entryService.getEntriesList({
            page: this.paginator?.pageIndex ?? 0,
            limit: this.paginator?.pageSize ?? 15,
            title: this.filters.title,
            feed_id: this.filters.feed,
            author: this.filters.author,
            order_by: this.orderBy,
          })
        )
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.results_length = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
        window.scrollTo(0, 0);
      });
  }

  // Paginator handling
  handlePageChange() {
    this.fetchEntries$.next();
  }

  getFilters(urlFilters: string) {
    const params = urlFilters.split('&');

    // Initialize an object to store the extracted values
    const extractedValues = {};

    // Loop through the array and extract parameter-value pairs
    params.forEach((param) => {
      const [key, value] = param.split('=');
      extractedValues[key] = value;
    });

    this.filters.title = extractedValues['title'] ?? '';
    this.filters.feed = extractedValues['feed'] ?? '';
    this.filters.author = extractedValues['author'] ?? '';
    this.fetchEntries$.next();
  }

  // Sort by
  sort(orderBy: string, activeButton: string) {
    // set active button based on given title
    this.buttons = this.buttons.map((button) => {
      if (button.title === activeButton) {
        return { ...button, active: true };
      } else {
        return { ...button, active: false };
      }
    });
    this.orderBy = orderBy; // set type
    this.fetchEntries$.next(); // fetch
  }

  // Open filters dialog
  openFilters() {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '500px',
      maxWidth: '95%',
      data: { filters: this.filters },
    });

    // when closed
    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (
            result: 'no' & {
              title: string;
              author: string;
              feed: string;
              from: string;
              to: string;
            }
          ) => result !== 'no' && result !== undefined
        ),
        map(
          (result) => (
            // set filters
            (this.filters.title = result.title),
            (this.filters.author = result.author),
            (this.filters.feed = result.feed)
          )
        )
      )
      .subscribe(() => {
        this.router.navigateByUrl(
          `elvira/library/${this.filters.getFilters()}` // go go go
        );
      });
  }

  reload() {
    this.fetchEntries$.next();
  }

  // Clear filters used when there were no results
  clearFilter() {
    if (this.filters.title || this.filters.author || this.filters.feed) {
      this.filters.title = '';
      this.filters.feed = '';
      this.filters.author = '';
      this.router.navigateByUrl(`/elvira/library/${this.filters.getFilters()}`);
    }
  }
}
