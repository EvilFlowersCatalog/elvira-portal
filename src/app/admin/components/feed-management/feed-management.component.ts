import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Subject, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { FeedTreeNode } from 'src/app/library/library.types';
import { FiltersService } from 'src/app/library/services/filters/filters.service';
import { AdminService } from '../../services/admin.service';
import { NewFeed } from '../../services/admin.types';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';
import { NewFeedDialogComponent } from '../dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateFeedDialogComponent } from '../dialogs/update-feed-dialog/update-feed-dialog.component';
import { Guid } from 'js-guid';

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
  treeControl = new NestedTreeControl<FeedTreeNode>((node) => node.entry);
  treeDataSource = new MatTreeNestedDataSource<FeedTreeNode>();

  constructor(
    private readonly filtersService: FiltersService,
    public dialog: MatDialog,
    private readonly route: ActivatedRoute,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    super();
  }

  ngOnInit(): void {
    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() => this.filtersService.getFeedTreeNode())
      )
      .subscribe((data) => {
        console.log(data);
        this.treeDataSource.data = data.entry;
      });
  }

  createFeed(parentFeedId: string, parentFeedName: string) {
    const dialogRef = this.dialog.open(NewFeedDialogComponent, {
      width: '50%',
      data: { parentName: parentFeedName },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((result) => {
        if (result != 'no') {
          const newFeedData: NewFeed = {
            parents: [parentFeedId],
            title: result.feedTitle,
            url_name: Guid.newGuid().toString(),
            content: result.feedTitle,
            kind: result.feedKind,
          };

          console.log(newFeedData);

          this.adminService
            .addNewFeed(newFeedData)
            .pipe(
              take(1),
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
            .subscribe(() => this.fetchFeeds$.next());
        }
      });
  }

  editFeed(feedTitle: string, feedKind: string, parentFeedName?: string) {
    const dialogRef = this.dialog.open(UpdateFeedDialogComponent, {
      width: '50%',
      data: { title: feedTitle, parentName: parentFeedName, kind: feedKind },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((result) => {
        if (result != 'no') {
          // const newFeedData: NewFeed = {
          //   parents: [parentFeedId],
          //   title: result.feedTitle,
          //   url_name: Guid.newGuid().toString(),
          //   content: result.feedTitle,
          //   kind: result.feedKind,
          // };
          // console.log(newFeedData);
          // this.adminService
          //   .addNewFeed(newFeedData)
          //   .pipe(
          //     take(1),
          //     tap(() => {
          //       const message = this.translocoService.translate(
          //         'lazy.feedManagement.feedPostSuccess'
          //       );
          //       this.notificationService.success(message);
          //     }),
          //     catchError((err) => {
          //       console.log(err);
          //       const message = this.translocoService.translate(
          //         'lazy.feedManagement.feedPostError'
          //       );
          //       this.notificationService.error(message);
          //       return throwError(err);
          //     })
          //   )
          //   .subscribe(() => this.fetchFeeds$.next());
        }
      });
  }

  deleteFeed(feedId: string, feedTitle: string) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: { title: feedTitle },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((result) => {
        if (result != 'no') {
          this.adminService
            .deleteFeed(feedId)
            .pipe(
              take(1),
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
            .subscribe(() => this.fetchFeeds$.next());
        }
      });
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';
}
