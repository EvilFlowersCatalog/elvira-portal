import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject } from 'rxjs';
import {
  concatMap,
  startWith,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntriesItem } from '../../types/library.types';
import { EntriesService } from '../../services/entries.service';
import { MediaObserver } from '@angular/flex-layout';
import { ActivatedRoute } from '@angular/router';
import { FilterService } from '../../services/filter.service';
import { FeedsService } from '../../services/feeds.service';

@Component({
  selector: 'app-all-entries',
  templateUrl: './allEntries.component.html',
  styleUrls: ['./allEntries.component.scss'],
})
export class AllEntriesComponent extends DisposableComponent implements OnInit {
  entries: EntriesItem[];
  resultsLength = 0;
  fetchEntries$ = new Subject();
  filters: any;
  showFilters: boolean = false;
  feedName: string = "";
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly entriesService: EntriesService,
    private readonly route: ActivatedRoute,
    private readonly filterService: FilterService,
    private readonly feedsService: FeedsService,
    public mediaObserver: MediaObserver
  ) {
    super();
  }

  ngOnInit(): void {
    this.filters = this.filterService.getFilter();
    if(this.filters.params.feed_id){
      this.getFeedName(this.filters.params.feed_id);
    }
    window.onbeforeunload = () => this.ngOnDestroy();

    this.fetchEntries$
    .asObservable()
    .pipe(
      takeUntil(this.destroySignal$),
      startWith([]),
      concatMap(() => this.entriesService.getEntries(this.filterService.getFilter()))
    )
    .subscribe((data) => {
      this.entries = data.items;
      this.resultsLength = data.metadata.total;
      this.paginator.pageIndex = data.metadata.page - 1;
    });

    this.filterService.changed$.pipe(
      takeUntil(this.destroySignal$)
    ).subscribe((changed) => {
      if (changed) {
        this.fetchEntries$.next();
        this.filters = this.filterService.getFilter();
        if(this.filters.params.feed_id){
          this.getFeedName(this.filters.params.feed_id);
        }
      }
    });
  }

  handlePageChange() {
    this.filterService.setPage(this.paginator?.pageIndex);
    this.filterService.setLimit(this.paginator?.pageSize);
    this.fetchEntries$.next();
  }

  getFeedName(feedId: string) {
    this.feedsService.getFeedDetails(feedId)
    .subscribe((data) => this.feedName = data.response.title);
  }

  removeFilter(type: string) {
    if(type === "title") {
      this.filterService.setTitle("");
    }
    else if (type === "feed") {
      this.filterService.setFeed("");
      this.feedName = "";
    }
    this.fetchEntries$.next();
  }

}
