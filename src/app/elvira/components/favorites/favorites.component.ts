import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntryService } from 'src/app/services/entry.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { FavoriteCounterService } from 'src/app/services/general/favorite-count.service';
import { Entry } from 'src/app/types/entry.types';
import { Favorite } from 'src/app/types/favorite.types';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent extends DisposableComponent implements OnInit {
  favorities: Favorite[] = []; // used in html
  resultsLength = 0;
  fetchFavorities$ = new Subject();
  searchForm: UntypedFormGroup;
  wasApplied: boolean = false;
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly favoriteService: FavoriteService,
    private readonly favoriteCounterService: FavoriteCounterService
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      search: new UntypedFormControl(''),
    });
  }

  ngOnInit(): void {
    this.favoriteCounterService.resetCounter(); // reset count

    this.fetchFavorities$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = '') =>
          this.favoriteService.getFavorites({
            page: this.paginator?.pageIndex ?? 0,
            limit: this.paginator?.pageSize ?? 15,
            title: title,
          })
        )
      )
      .subscribe((data) => {
        this.favorities = data.items;
        this.resultsLength = data.metadata.total;
        window.scrollTo(0, 0);
      });
  }

  favoritePagination() {
    this.fetchFavorities$.next();
  }

  reload() {
    this.fetchFavorities$.next();
  }

  submit() {
    if (this.searchForm?.value.search) {
      this.wasApplied = true;
      const title = this.searchForm.value.search;
      this.fetchFavorities$.next(title);
    } else if (this.wasApplied) {
      this.wasApplied = false;
      this.fetchFavorities$.next();
    }
  }
}
