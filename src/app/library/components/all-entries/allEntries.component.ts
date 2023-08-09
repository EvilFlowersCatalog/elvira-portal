import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Observable, Subject } from 'rxjs';
import {
  concatMap,
  map,
  pluck,
  startWith,
  take,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { State } from 'src/app/common/types/app-state.types';
import {
  ListEntriesResponse,
  EntriesItem,
  EntriesParams,
} from '../../types/library.types';
import { EntriesService } from '../../services/entries.service';
import { MediaObserver } from '@angular/flex-layout';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-all-entries',
  templateUrl: './allEntries.component.html',
  styleUrls: ['./allEntries.component.scss'],
})
export class AllEntriesComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[];
  resultsLength = 0;
  fetchEntries$ = new Subject<EntriesParams>();
  searchForm: UntypedFormGroup;
  fullText: boolean = false;
  feedId: string = null;
  wasApplied: boolean = false;
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly appStateService: AppStateService,
    private readonly entriesService: EntriesService,
    private readonly route: ActivatedRoute,
    public mediaObserver: MediaObserver
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      searchInput: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.feedId = this.route.snapshot.paramMap.get('feedId');
    window.onbeforeunload = () => this.ngOnDestroy();

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
          this.feedId
        )
      )
    )
    .subscribe((data) => {
      this.entries = data.items;
      this.resultsLength = data.metadata.total;
      this.paginator.pageIndex = data.metadata.page - 1;
    });
  }

  handlePageChange() {
    this.fetchEntries$.next({
      search: this.searchForm?.value.searchInput?.toLocaleLowerCase(),
      feed: null, // already set in fetchEntries
      page: this.paginator?.pageIndex,
      limit: this.paginator?.pageSize
    });
  }

  fullTextChange() {
    this.fullText = !this.fullText;
  }

  clearSearch() {
    this.searchForm.controls['searchInput'].reset();
    if(this.wasApplied) {
      this.applyFilter();
      this.wasApplied= false;
    }
  }

  applyFilter() {
    if(!this.fullText) {
      this.wasApplied = true;
      this.fetchEntries$.next({
        search: this.searchForm?.value.searchInput?.toLocaleLowerCase(),
        feed: null, // already set in fetchEntries
        page: this.paginator?.pageIndex,
        limit: this.paginator?.pageSize
      });
    }
    else {
      this.fullTextSearch();
    }
  }

  fullTextSearch() {
    // not implemented yet
    console.log(this.searchForm?.value.searchInput);
  }

}
