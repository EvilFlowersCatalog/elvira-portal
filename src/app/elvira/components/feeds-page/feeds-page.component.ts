import { Component, OnInit, ViewChild } from '@angular/core'
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
  results_length = 0; // used in html
  was_applied: boolean = false;
  fetchFeeds$ = new Subject();
  feed_id: string;
  feed_path: string[] = [];
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly feedService: FeedService,
    private readonly router: Router,
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    // Get feed id
    this.route.paramMap
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((paramMap) => {
        this.feed_id = paramMap.get('feed_id');
        this.feed_path.push(this.feed_id); // push id to path
        // Trigger fetching of feeds whenever feed_id changes
        this.fetchFeeds$.next();
      });

    // Get feed detail
    this.feedService.getFeedDetail(this.feed_id)
      .subscribe((data) => this.title = data.response.title);

    // Used for continually changing feeds
    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = "") => this.feedService.getFeedsList({
          page: this.paginator?.pageIndex ?? 0,
          limit: this.paginator?.pageSize ?? 15,
          parent_id: this.feed_id,
          title: title
        }))
      )
      .subscribe((data) => {
        this.feeds_children = data.items;
        this.results_length = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      })
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
    if (this.feed_path.length > 1) { // if there is more than 1 id (means there is more than main feed) go back
      this.feed_path.pop(); // remove last id
      this.router.navigateByUrl(`/elvira/feeds/${this.feed_path[this.feed_path.length - 1]}`);
    } else { // if there is only main feed_id
      this.feed_path.pop(); // remove 
      this.router.navigateByUrl('/elvira/home');
    }
  }

  applyFilter() {
    this.was_applied = true;
    this.fetchFeeds$.next(this.search_form?.value.search_input ? this.search_form?.value.search_input : "");
  }

  handlePageChange() {
    this.fetchFeeds$.next();
  }
}