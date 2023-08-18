import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntryService } from 'src/app/services/entry.service';
import { Entry } from 'src/app/types/entry.types';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent extends DisposableComponent implements OnInit {
  entries: Entry[] = [];
  resultsLength = 0;
  fetchEntries$ = new Subject();

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(private readonly entryService: EntryService) {
    super();
  }

  ngOnInit(): void {
    // Commented out because of 404 - not implemented yet on BE side
    // this.fetchEntries$
    //   .asObservable()
    //   .pipe(
    //     startWith({}),
    //     takeUntil(this.destroySignal$),
    //     concatMap(() =>
    //       this.entriesService.listFavoriteEntries(
    //         this.paginator?.pageIndex ?? 0,
    //         this.paginator?.pageSize ?? 12
    //       )
    //     )
    //   )
    //   .subscribe((data) => {
    //     this.entries = data.items;
    //     this.resultsLength = data.metadata.total;
    //   });
  }

  favoritePagination() {
    this.fetchEntries$.next();
  }

  deleteFromFavorites() {
    this.fetchEntries$.next();
  }
}
