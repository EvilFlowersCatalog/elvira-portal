import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntriesItem } from '../../types/library.types';
import { EntriesService } from '../../services/entries.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent extends DisposableComponent implements OnInit {
  entries: EntriesItem[] = [];
  resultsLength = 0;
  fetchEntries$ = new Subject();

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(private readonly entriesService: EntriesService) {
    super();
  }

  ngOnInit(): void {
    this.fetchEntries$
      .asObservable()
      .pipe(
        startWith({}),
        takeUntil(this.destroySignal$),
        concatMap(() =>
          this.entriesService.listFavoriteEntries(
            this.paginator?.pageIndex ?? 0,
            this.paginator?.pageSize ?? 12
          )
        )
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.resultsLength = data.metadata.total;
      });
  }

  favoritePagination() {
    this.fetchEntries$.next();
  }

  deleteFromFavorites() {
    this.fetchEntries$.next();
  }
}
