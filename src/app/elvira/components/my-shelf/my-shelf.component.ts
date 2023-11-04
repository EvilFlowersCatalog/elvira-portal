import { Component, HostListener, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MyShelfService } from 'src/app/services/my-shelf.service';
import { MyShelfCounterService } from 'src/app/services/general/my-shelf-count.service';
import { MyShelf } from 'src/app/types/my-shelf.types';

@Component({
  selector: 'app-my-shelf',
  templateUrl: './my-shelf.component.html',
  styleUrls: ['./my-shelf.component.scss'],
})
export class MyShelfComponent extends DisposableComponent implements OnInit {
  myShelf: MyShelf[] = []; // used in html
  fetchMyShelf$ = new Subject();
  searchForm: UntypedFormGroup;
  wasApplied: boolean = false;
  orderBy: string = 'entry__title';
  page: number = 0;
  refresh: boolean = false;
  resetEntries: boolean = false; // in fetch entries
  liked: boolean = false; // when liked button is pressed, reload different
  lenght: number = 0; // for saving actual entires.lenght, for reaload (used when entry was liked)
  loaded: boolean = false; // when the shelf was loaded set to true // used in html
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
      class: 'my-shelf-tools-button',
      toolTip: 'lazy.library.aZToolTip',
      active: true,
      onClick: () => this.sort('entry__title', this.buttons[0].title),
    },
    {
      title: 'z-A',
      icon: 'sort',
      class: 'my-shelf-tools-button',
      toolTip: 'lazy.library.zAToolTip',
      active: false,
      onClick: () => this.sort('-entry__title', this.buttons[1].title),
    },
    {
      title: 'ASC',
      icon: '',
      class: 'my-shelf-tools-button',
      toolTip: 'lazy.library.ASCToolTip',
      active: false,
      onClick: () => this.sort('created_at', this.buttons[2].title),
    },
    {
      title: 'DE\nSC',
      icon: '',
      class: 'my-shelf-tools-button',
      toolTip: 'lazy.library.DESCToolTip',
      active: false,
      onClick: () => this.sort('-created_at', this.buttons[3].title),
    },
  ];

  constructor(
    private readonly myShelfService: MyShelfService,
    private readonly myShelfCounterService: MyShelfCounterService
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
      this.fetchMyShelf$.next();
    }
  }

  ngOnInit(): void {
    this.myShelfCounterService.resetCounter(); // reset count

    this.fetchMyShelf$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = '') =>
          this.myShelfService.getMyShelf({
            page: this.page,
            limit: this.liked ? this.lenght : 25,
            title: title,
            order_by: this.orderBy,
          })
        )
      )
      .subscribe((data) => {
        this.loaded = true;
        this.liked = false; // reset liked
        if (this.resetEntries) {
          this.resetEntries = false;
          this.myShelf = data.items;
          window.scrollTo(0, 0);
        } else {
          this.myShelf.push(...data.items); // push
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
    this.fetchMyShelf$.next(); // fetch
  }

  reload() {
    this.liked = true; // set to true
    this.lenght = this.myShelf.length; // save lenght to set limit
    this.reset();
    this.fetchMyShelf$.next();
  }

  reset() {
    this.page = 0; // reset
    this.resetEntries = true;
  }

  submit() {
    if (this.searchForm?.value.search) {
      this.wasApplied = true;
      const title = this.searchForm.value.search;
      this.reset();
      this.fetchMyShelf$.next(title);
    } else if (this.wasApplied) {
      this.wasApplied = false;
      this.reset();
      this.fetchMyShelf$.next();
    }
  }
}
