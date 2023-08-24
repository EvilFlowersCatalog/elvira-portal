import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject } from 'rxjs';
import {
  concatMap,
  startWith,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MediaObserver } from '@angular/flex-layout';
import { Entry, EntryQuery } from 'src/app/types/entry.types';
import { EntryService } from 'src/app/services/entry.service';
import { FilterService } from 'src/app/services/general/filter.service';
import { FeedService } from 'src/app/services/feed.service';

@Component({
  selector: 'app-all-entries',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss'],
})
export class LibraryComponent extends DisposableComponent implements OnInit {
  entries: Entry[] = []; // used in html
  results_length = 0; // used in html
  fetchEntries$ = new Subject();
  filters: EntryQuery; // used in html
  show_filters: boolean = false; // used in html
  feed_name: string = ""; // used in html
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly entryService: EntryService,
    private readonly filterService: FilterService,
    private readonly feedService: FeedService,
    public mediaObserver: MediaObserver
  ) {
    super();
  }

  ngOnInit(): void {
    this.filters = this.filterService.getFilter(); // Get used filters
    // idk
    window.onbeforeunload = () => this.ngOnDestroy();

    // For dinamic changes
    this.fetchEntries$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() => this.entryService.getEntriesList(this.filterService.getFilter()))
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.results_length = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      });

    this.filterService.changed$.pipe(
      takeUntil(this.destroySignal$)
    ).subscribe((changed) => {
      if (changed) {
        this.fetchEntries$.next();
        this.filters = this.filterService.getFilter();
        if (this.filters.feed_id) {
          this.getFeedName(this.filters.feed_id);
        }
      }
    });
  }

  // Paginator handling
  handlePageChange() {
    this.filterService.setPage(this.paginator?.pageIndex);
    this.filterService.setLimit(this.paginator?.pageSize);
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
      this.filterService.setTitle("");
    }
    else if (type === "feed") {
      this.filterService.setFeed("");
      this.feed_name = "";
    }
    this.fetchEntries$.next();
  }

}
