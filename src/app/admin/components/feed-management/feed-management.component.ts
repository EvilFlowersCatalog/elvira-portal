import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { concatMap, startWith, take, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { FeedTreeNode } from 'src/app/library/library.types';
import { FiltersService } from 'src/app/library/services/filters/filters.service';

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
  tabIndex: number;

  constructor(
    private readonly filtersService: FiltersService,
    public dialog: MatDialog,
    private readonly route: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.tabIndex = params['index'];

      if (this.tabIndex == 1) {
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
    });
  }

  createFeed(parentFeedId: string) {
    console.log('create', parentFeedId);
  }

  editFeed(feedId: string) {
    console.log('editing', feedId);
  }

  deleteFeed(feedId: string) {
    console.log('deleting', feedId);
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';
}
