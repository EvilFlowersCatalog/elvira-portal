import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, Subject } from 'rxjs';
import {
  concatMap,
  distinctUntilKeyChanged,
  map,
  pluck,
  startWith,
  take,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { Filters, State } from 'src/app/common/types/app-state.types';
import {
  ListEntriesResponse,
  EntriesItem,
  EntriesParams,
} from '../../types/library.types';
import { EntriesService } from '../../services/entries.service';
import { MediaObserver } from '@angular/flex-layout';

const filterCompare = (a: Filters, b: Filters) => {
  return (
    a?.search === b?.search &&
    a?.author?.id === b?.author?.id &&
    a?.feed === b?.feed
  );
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[];
  resultsLength = 0;
  fetchEntries$ = new Subject<EntriesParams>();
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly appStateService: AppStateService,
    private readonly entriesService: EntriesService,
    public mediaObserver: MediaObserver
  ) {
    super();
  }

  ngOnInit(): void {
    this.appStateService.patchState({ showSidebarToggle: true });
    window.onbeforeunload = () => this.ngOnDestroy();
    this.sidebarState$ = this.appStateService.getState$().pipe(
      takeUntil(this.destroySignal$),
      map((data: State) => data.sidebar)
    );

    this.fetchEntries$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((params: EntriesParams) =>
          this.entriesService.getEntries(
            params.page ?? 0,
            params.limit ?? 15,
            params.search,
            params.authorId,
            params.feed
          )
        )
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.paginator.pageIndex = data.metadata.page - 1;
        this.resultsLength = data.metadata.total;
      });

    this.appStateService
      .getState$()
      .pipe(
        takeUntil(this.destroySignal$),
        distinctUntilKeyChanged('filters', filterCompare),
        pluck('filters'),
        map((filters: Filters) => ({
          search: filters?.search,
          authorId: filters?.author?.id,
          feed: filters?.feed,
          page: 0,
          limit: this.paginator?.pageSize ?? 15,
        }))
      )
      .subscribe((data) => {
        this.fetchEntries$.next(data);
      });
  }

  ngOnDestroy(): void {
    this.appStateService.patchState({ showSidebarToggle: false });
  }

  hideSidebar() {
    this.appStateService.patchState({ sidebar: false });
  }

  handlePageChange() {
    this.appStateService
      .getState$()
      .pipe(
        take(1),
        pluck('filters'),
        map((filters: Filters) => ({
          search: filters?.search,
          authorId: filters?.author?.id,
          feed: filters?.feed,
          page: this.paginator?.pageIndex,
          limit: this.paginator?.pageSize,
        }))
      )
      .subscribe((params) => this.fetchEntries$.next(params));
  }
}
