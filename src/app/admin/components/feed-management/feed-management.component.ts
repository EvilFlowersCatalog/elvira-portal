import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Subject, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
//import { FiltersService } from 'src/app/library/services/filters.service';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';
import { NewFeedDialogComponent } from '../dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateFeedDialogComponent } from '../dialogs/update-feed-dialog/update-feed-dialog.component';
import { Guid } from 'js-guid';
import { MatPaginator } from '@angular/material/paginator';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { FeedService } from 'src/app/services/feed.service';
import { NotificationService } from 'src/app/services/general/notification.service';
import { Feed, FeedNew } from 'src/app/types/feed.types';

@Component({
  selector: 'app-feed-management',
  templateUrl: './feed-management.component.html',
  styleUrls: ['./feed-management.component.scss'],
})
export class FeedManagementComponent
  extends DisposableComponent
  implements OnInit {
  fetchFeeds$ = new Subject();
  data_source: Feed[] = []; // used in html
  search_form: UntypedFormGroup; // used in html
  results_length: number = 0; // used in html
  feed_path: { title: string, id: string }[] = []; // path of feeds
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    public dialog: MatDialog,
    private readonly feedService: FeedService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    // Push first parent id as null
    this.feed_path.push({ title: '', id: 'null' });

    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = "") => this.feedService.getFeedsList({
          page: this.paginator?.pageIndex ?? 0,
          limit: this.paginator?.pageSize ?? 15,
          parent_id: this.feed_path[this.feed_path.length - 1].id, // whatever is actuall feed id
          title: title,
        }))
      )
      .subscribe((data) => {
        this.data_source = data.items;
        this.results_length = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      });
  }

  // next feeds
  nextFeeds(feed: Feed) {
    if (feed.kind === "navigation") {
      this.feed_path.push({ title: feed.title, id: feed.id }); // push new parent id
      this.fetchFeeds$.next();
    }
  }

  // go back in path
  goBack() {
    if (this.feed_path[this.feed_path.length - 1].id !== "null") {
      this.feed_path.pop(); // pop old parent id
      this.fetchFeeds$.next();
    }
  }

  // create new feed
  createFeed() {
    // create dialog
    const dialogRef = this.dialog.open(NewFeedDialogComponent, {
      width: '50%',
      data: { parent_id: this.feed_path[this.feed_path.length - 1].id, parent_name: this.feed_path[this.feed_path.length - 1].title },
    });

    // after dialog is closed
    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (result: 'no' & { feed_title: string; feed_kind: string; feed_content: string, feed_parents: string[] }) =>
            result !== 'no'
        ),
        map((result) => ({
          // Set new feed
          catalog_id: environment.catalog_id,
          parents: result.feed_parents,
          title: result.feed_title,
          url_name: Guid.newGuid().toString(),
          content: result.feed_content,
          kind: result.feed_kind,
        })),
        concatMap((feed: FeedNew) =>
          this.feedService.createFeed(feed)
        ),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedPostSuccess'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedPostError'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.fetchFeeds$.next(); // update new list of feeds
      });
  }

  // Edit existing feed
  editFeed(feed: Feed) {
    // create edit dialog
    const dialogRef = this.dialog.open(UpdateFeedDialogComponent, {
      width: '50%',
      data: { title: feed.title, parents: feed.parents, kind: feed.kind, content: feed.content },
    });

    // after dialog is closed
    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (result: 'no' & { feed_title: string; feed_kind: string; feed_parents: string[]; feed_content: string }) =>
            result !== 'no'
        ),
        map((result) => ({
          // set edited data
          catalog_id: environment.catalog_id,
          title: result.feed_title,
          parents: result.feed_parents,
          url_name: feed.url_name, // this already exists (do not need to be changed), but it's required on BE
          content: result.feed_content,
          kind: result.feed_kind,
        })),
        concatMap((updated_feed: FeedNew) =>
          this.feedService.updateFeed(feed.id, updated_feed)
        ),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedPostSuccess'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedPostError'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.fetchFeeds$.next() // reload
      });
  }

  // delete feed
  deleteFeed(feed: Feed) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: { title: feed.title },
    });

    // after closed
    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        // if result is not 'no' then delete
        filter((result) => result !== 'no'),
        concatMap(() => this.feedService.deleteFeed(feed.id)),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedDeleteSuccess'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.feedManagement.feedDeleteError'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.fetchFeeds$.next(); // reload
      });
  }

  applyFilter() {
    this.fetchFeeds$.next(this.search_form?.value.search_input);
  }

  handlePageChange() {
    this.fetchFeeds$.next();
  }
}
