import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { concatMap, startWith, take, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { FeedTreeNode } from 'src/app/library/library.types';
import { FiltersService } from 'src/app/library/services/filters/filters.service';
import { AdminService } from '../../services/admin.service';
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
          // this.adminService.addNewFeed(this.getFeedData(result)).subscribe(() => {
          //   this.changeListenerService.statusChanged();
          // });
          // const message = this.translocoService.translate(
          //   'lazy.adminPage.success-message-feed'
          // );
          // this.notificationService.success(message);
        }
        console.log(result);
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
