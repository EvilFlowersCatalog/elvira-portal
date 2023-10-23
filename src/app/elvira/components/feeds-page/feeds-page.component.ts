import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MatPaginator } from '@angular/material/paginator';
import { Feed } from 'src/app/types/feed.types';
import { FeedService } from 'src/app/services/feed.service';

@Component({
  selector: 'app-feeds-page',
  templateUrl: './feeds-page.component.html',
  styleUrls: ['./feeds-page.component.scss'],
})
export class FeedsPageComponent extends DisposableComponent implements OnInit {
  feeds_children: Feed[] = []; // used in html
  title: string; // used in html
  search_form: UntypedFormGroup; // used in html
  was_applied: boolean = false;
  fetchFeeds$ = new Subject();
  feed_id: string;
  refresh: boolean = false;
  page: number = 0;
  firstScroll: boolean = true;
  resetFeeds: boolean = false; // in fetch entries
  feed_path: { name: string; id: string }[] = [];
  orderBy: string = 'title';
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
      class: 'feed-page-tools-button',
      toolTip: 'lazy.library.aZToolTip',
      active: true,
      onClick: () => this.sort('title', this.buttons[0].title),
    },
    {
      title: 'z-A',
      icon: 'sort',
      class: 'feed-page-tools-button',
      toolTip: 'lazy.library.zAToolTip',
      active: false,
      onClick: () => this.sort('-title', this.buttons[1].title),
    },
    {
      title: 'ASC',
      icon: '',
      class: 'feed-page-tools-button',
      toolTip: 'lazy.library.ASCToolTip',
      active: false,
      onClick: () => this.sort('created_at', this.buttons[2].title),
    },
    {
      title: 'DE\nSC',
      icon: '',
      class: 'feed-page-tools-button',
      toolTip: 'lazy.library.DESCToolTip',
      active: false,
      onClick: () => this.sort('-created_at', this.buttons[3].title),
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly feedService: FeedService,
    private readonly router: Router
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
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
      this.fetchFeeds$.next();
    }
  }

  ngOnInit(): void {
    // Get feed id
    this.route.paramMap
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((paramMap) => {
        this.feed_id = paramMap.get('feed_id');
        this.page = 0;
        this.resetFeeds = true;
        this.firstScroll = true;
        this.search_form.reset();

        // Get feed detail
        this.feedService.getFeedDetail(this.feed_id).subscribe((data) => {
          this.title = data.response.title;
          let isThere = false;
          this.feed_path.forEach(({ name }) => {
            if (name === data.response.title) {
              isThere = true;
            }
          });
          if (!isThere)
            this.feed_path.push({
              name: data.response.title,
              id: data.response.id,
            });
        });

        // Trigger fetching of feeds whenever feed_id changes
        this.fetchFeeds$.next();
      });

    // Used for continually changing feeds
    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = '') =>
          this.feedService.getFeedsList({
            page: this.page,
            limit: 50,
            parent_id: this.feed_id,
            title: title,
            order_by: this.orderBy,
          })
        )
      )
      .subscribe((data) => {
        if (this.resetFeeds) {
          this.resetFeeds = false;
          this.feeds_children = data.items;
        } else {
          this.feeds_children.push(...data.items); // push
        }

        // When user comes to feed page first time scroll up or feeds were reseted (reset funtion)
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
    this.fetchFeeds$.next(); // fetch
  }

  // Used in html, for clear input
  clearSearch() {
    this.search_form.controls['search_input'].reset();
    if (this.was_applied) {
      this.applyFilter();
      this.was_applied = false;
    }
  }

  goBack() {
    if (this.feed_path.length > 1) {
      // if there is more than 1 id (means there is more than main feed) go back
      this.feed_path.pop(); // remove last id
      this.router.navigateByUrl(
        `/elvira/feeds/${this.feed_path[this.feed_path.length - 1].id}`
      );
    } else {
      // if there is only main feed_id
      this.feed_path.pop(); // remove
      this.router.navigateByUrl('/elvira/home');
    }
  }

  goTo(feed: { name: string; id: string }) {
    if (feed.name !== this.title) {
      const index = this.feed_path.indexOf(feed);
      this.feed_path = this.feed_path.slice(0, index + 1); // remove everything after choosen one

      // navigate to last
      this.router.navigateByUrl(
        `/elvira/feeds/${this.feed_path[this.feed_path.length - 1].id}`
      );
    }
  }

  reset() {
    this.resetFeeds = true;
    this.firstScroll = true;
    this.page = 0;
  }

  applyFilter() {
    if (this.search_form?.value.search_input) {
      this.was_applied = true;
      this.reset();
      this.fetchFeeds$.next(this.search_form?.value.search_input);
    } else if (this.was_applied) {
      this.was_applied = false;
      this.reset();
      this.fetchFeeds$.next();
    }
  }
}
