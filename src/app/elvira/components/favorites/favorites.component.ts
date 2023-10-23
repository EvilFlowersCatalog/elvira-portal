import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
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
  fetchFavorities$ = new Subject();
  searchForm: UntypedFormGroup;
  wasApplied: boolean = false;
  orderBy: string = '-created_at';
  page: number = 0;
  refresh: boolean = false;
  firstScroll: boolean = true;
  resetEntries: boolean = false; // in fetch entries
  liked: boolean = false; // when liked button is pressed, reload different
  lenght: number = 0; // for saving actual entires.lenght, for reaload (used when entry was liked)
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
      title: 'a-Z',
      icon: 'sort',
      class: 'favorities-tools-button',
      toolTip: 'lazy.library.aZToolTip',
      active: false,
      onClick: () => this.sort('title', this.buttons[0].title),
    },
    {
      title: 'z-A',
      icon: 'sort',
      class: 'favorities-tools-button',
      toolTip: 'lazy.library.zAToolTip',
      active: false,
      onClick: () => this.sort('-title', this.buttons[1].title),
    },
    {
      title: 'ASC',
      icon: '',
      class: 'favorities-tools-button',
      toolTip: 'lazy.library.ASCToolTip',
      active: false,
      onClick: () => this.sort('created_at', this.buttons[2].title),
    },
    {
      title: 'DE\nSC',
      icon: '',
      class: 'favorities-tools-button',
      toolTip: 'lazy.library.DESCToolTip',
      active: true,
      onClick: () => this.sort('-created_at', this.buttons[3].title),
    },
  ];

  constructor(
    private readonly favoriteService: FavoriteService,
    private readonly favoriteCounterService: FavoriteCounterService
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      search: new UntypedFormControl(''),
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const windowHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const pageHeight = document.body.scrollHeight;

    // if we are at bottom and there is possible refresh, fetch entries
    if (scrollPosition + windowHeight >= pageHeight - 500 && this.refresh) {
      this.refresh = false;
      this.fetchFavorities$.next();
    }
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
            page: this.page,
            limit: this.liked ? this.lenght : 25,
            title: title,
            order_by: this.orderBy,
          })
        )
      )
      .subscribe((data) => {
        this.liked = false; // reset liked
        if (this.resetEntries) {
          this.resetEntries = false;
          this.favorities = data.items;
        } else {
          this.favorities.push(...data.items); // push
        }

        // When user comes to library first time scroll up or entries were reseted (reset funtion)
        if (this.firstScroll) {
          this.firstScroll = false;
          window.scrollTo(0, 0);
        }

        // Check if actuall page is last or not, if not user can refresh
        if (this.page !== data.metadata.pages - 1) {
          this.refresh = true;
          this.page += 1; // next page
        }
      });
  }

  // Sort by
  sort(orderBy: string, activeButton: string) {
    // set active button based on given title
    this.buttons = this.buttons.map((button) => {
      return { ...button, active: button.title === activeButton };
    });
    this.orderBy = orderBy; // set type
    this.reset();
    this.fetchFavorities$.next(); // fetch
  }

  reload() {
    this.liked = true; // set to true
    this.lenght = this.favorities.length; // save lenght to set limit
    this.reset();
    this.fetchFavorities$.next();
  }

  reset() {
    this.page = 0; // reset
    this.firstScroll = true;
    this.resetEntries = true;
  }

  submit() {
    if (this.searchForm?.value.search) {
      this.wasApplied = true;
      const title = this.searchForm.value.search;
      this.reset();
      this.fetchFavorities$.next(title);
    } else if (this.wasApplied) {
      this.wasApplied = false;
      this.reset();
      this.fetchFavorities$.next();
    }
  }
}
