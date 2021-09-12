import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  concatMap,
  distinctUntilKeyChanged,
  map,
  pluck,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { AllEntryItems } from 'src/app/admin/services/admin.types';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import {
  Filters,
  State,
} from 'src/app/common/services/app-state/app-state.types';
import { EntriesService } from '../../services/entries/entries.service';
import {
  EntriesItem,
  ListEntriesResponse,
} from '../../services/entries/entries.types';

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

    // this.appStateService
    //   .getState$()
    //   .pipe(takeUntil(this.destroySignal$), distinctUntilKeyChanged('filters'))
    //   .subscribe((state) => {
    //     const activeFilters = state.filters;
    //     if (activeFilters.search) {
    //       // get entries w search query
    //       this.entriesService
    //         .searchEntries(0, 12, activeFilters.search)
    //         .subscribe((data) => (this.entries = data.items));
    //     }
    //     if (activeFilters.author) {
    //       // get authors entries
    //     }
    //     if (activeFilters.feed) {
    //       // get entries by feed
    //       this.entriesService
    //         .getEntriesByFeed(0, 2, activeFilters.feed)
    //         .subscribe((data) => (this.entries = data.items));
    //     }
    //     if (
    //       activeFilters.search === null &&
    //       activeFilters.feed === null &&
    //       activeFilters.author === null
    //     ) {
    //       this.entriesService.listEntries(0, 2).subscribe((data) => {
    //         this.entries = data.items;
    //         // this.tableData = data.items;
    //         this.resultsLength = data.metadata.total;
    //         // this.dataSource = new MatTableDataSource(this.tableData);
    //         // this.dataSource.paginator = this.paginator;
    //       });
    //     }
    //   });

    this.appStateService
      .getState$()
      .pipe(
        takeUntil(this.destroySignal$),
        distinctUntilKeyChanged('filters'),
        pluck('filters'),
        concatMap((filters: Filters) =>
          this.entriesService.getEntries(
            0,
            this.paginator?.pageSize ?? 2,
            filters?.search,
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
        state?.filters?.search,
        state?.filters?.feed
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.resultsLength = data.metadata.total;
      });
  }
}
