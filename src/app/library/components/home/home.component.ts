import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import {
  concatMap,
  distinctUntilKeyChanged,
  map,
  pluck,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import {
  Filters,
  State,
} from 'src/app/common/services/app-state/app-state.types';
import { ListEntriesResponse, EntriesItem } from '../../library.types';
import { EntriesService } from '../../services/entries/entries.service';

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
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly appStateService: AppStateService,
    private readonly entriesService: EntriesService
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

    this.appStateService
      .getState$()
      .pipe(
        takeUntil(this.destroySignal$),
        distinctUntilKeyChanged('filters', filterCompare),
        pluck('filters'),
        concatMap((filters: Filters) =>
          this.entriesService.getEntries(
            0,
            this.paginator?.pageSize ?? 2,
            filters?.search,
            filters?.author?.id,
            filters?.feed
          )
        )
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.paginator.pageIndex = 0;
        this.resultsLength = data.metadata.total;
      });
  }

  ngOnDestroy(): void {
    this.appStateService.patchState({ showSidebarToggle: false });
  }

  hideSidebar() {
    this.appStateService.patchState({ sidebar: false });
  }

  homePagination() {
    const state = this.appStateService.getStateSnapshot();
    this.entriesService
      .getEntries(
        this.paginator.pageIndex,
        this.paginator.pageSize,
        state.filters?.search,
        state.filters?.author?.id,
        state.filters?.feed
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.resultsLength = data.metadata.total;
      });
  }
}
