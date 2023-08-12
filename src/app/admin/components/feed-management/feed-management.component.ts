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
import { NotificationService } from 'src/app/common/services/notification.service';
//import { FiltersService } from 'src/app/library/services/filters.service';
import { AdminService } from '../../services/admin.service';
import { FeedTreeNode, NewFeed, UpdateFeeds } from '../../types/admin.types';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';
import { NewFeedDialogComponent } from '../dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateFeedDialogComponent } from '../dialogs/update-feed-dialog/update-feed-dialog.component';
import { Guid } from 'js-guid';
import { FeedsService } from 'src/app/library/services/feeds.service';
import { MatPaginator } from '@angular/material/paginator';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-feed-management',
  templateUrl: './feed-management.component.html',
  styleUrls: ['./feed-management.component.scss'],
})
export class FeedManagementComponent
  extends DisposableComponent
  implements OnInit
{
  fetchFeeds$ = new Subject();
  dataSource: FeedTreeNode[] = []; 
  searchForm: UntypedFormGroup;
  resultsLength: number = 0;
  parent_id: string = "null";
  parentName: string = "Main feed"
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    //private readonly filtersService: FiltersService,
    public dialog: MatDialog,
    private readonly route: ActivatedRoute,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private readonly feedsService: FeedsService,
    private translocoService: TranslocoService
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      searchInput: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() => this.feedsService.getFeeds({
          page: this.paginator?.pageIndex ? this.paginator?.pageIndex + 1 : 1,
          limit: this.paginator?.pageSize ?? 15,
          parent_id: this.parent_id,
          title: this.searchForm?.value.searchInput ?? "",
        }))
      )
      .subscribe((data) => {
        this.dataSource = data.items;
        this.resultsLength = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      });
  }

  nextFeeds(feed: FeedTreeNode) {
    if(feed.kind === "navigation") {
      this.parentName = feed.title;
      this.parent_id = feed.id;
      this.fetchFeeds$.next();
    }
  }

  goBack() {
    if(this.parent_id !== "null") {
      this.feedsService.getFeedDetails(this.parent_id)
      .subscribe((data) => {
        this.parent_id = data.response.parents.length !== 0 ? data.response.parents[0] : "null";
        this.fetchFeeds$.next();
      });
    }
  }

  createFeed() {
    const dialogRef = this.dialog.open(NewFeedDialogComponent, {
      width: '50%',
      data: { parentName: this.parentName },
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter(
          (result: 'no' & { feedTitle: string; feedKind: string; feedContent: string }) =>
            result !== 'no'
        ),
        map((result) => ({
          catalog_id: environment.catalogId,
          parents: [this.parent_id === "null" ? "" : this.parent_id],
          title: result.feedTitle,
          url_name: Guid.newGuid().toString(),
          content: result.feedContent,
          kind: result.feedKind,
        })),
        concatMap((newFeedData: NewFeed) =>
          this.adminService.addNewFeed(newFeedData)
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
        this.fetchFeeds$.next();
      });
  }

  editFeed(feed: FeedTreeNode) {
    const dialogRef = this.dialog.open(UpdateFeedDialogComponent, {
      width: '50%',
      data: { title: feed.title, parentId: feed.parents[0], kind: feed.kind, content: feed.content },
    });

    dialogRef
    .afterClosed()
    .pipe(
      take(1),
      filter(
        (result: 'no' & { feedTitle: string; feedKind: string; feedsParentName: string; feedContent: string }) =>
          result !== 'no'
      ),
      map((result) => ({
        catalog_id: environment.catalogId,
        title: result.feedTitle,
        url_name: Guid.newGuid().toString(),
        content: result.feedContent,
        kind: result.feedKind,
      })),
      concatMap((newFeedData: UpdateFeeds) =>
        this.adminService.updateFeed(feed.id, newFeedData)
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
    this.fetchFeeds$.next()});
  }

  deleteFeed(feed: FeedTreeNode) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: { title: feed.title },
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter((result) => result !== 'no'),
        concatMap(() => this.adminService.deleteFeed(feed.id)),
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
        this.fetchFeeds$.next();
      });
  }

  applyFilter() {
    this.fetchFeeds$.next();
  }

  handlePageChange() {
    this.fetchFeeds$.next();
  }
}
