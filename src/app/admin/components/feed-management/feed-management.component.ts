import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
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
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { FeedTreeNode } from 'src/app/library/library.types';
import { FiltersService } from 'src/app/library/services/filters/filters.service';
import { AdminService } from '../../services/admin.service';
import { NewFeed } from '../../services/admin.types';
import { NewFeedDialogComponent } from '../dialogs/new-feed-dialog/new-feed-dialog.component';

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
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly changeListenerService: ChangeListenerService
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
            parent_id: parentFeedId,
            title: result.feedTitle,
            url_name: result.feedTitle
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-')
              .toLowerCase(),
            content: result.feedTitle,
            kind: result.feedKind,
          };

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

  editFeed(feedId: string) {
    console.log('editing', feedId);
  }

  deleteFeed(feedId: string) {
    console.log('deleting', feedId);

    this.adminService
      .deleteFeed(feedId)
      .pipe(take(1))
      .subscribe(() => this.fetchFeeds$.next());
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';
}
