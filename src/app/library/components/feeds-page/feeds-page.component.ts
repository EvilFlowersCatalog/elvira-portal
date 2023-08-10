import { Component, OnInit, ViewChild} from '@angular/core'
import { ActivatedRoute } from '@angular/router';
import { FeedDetailRespone, FeedTreeNode, ListFeedsResponse } from '../../types/library.types';
import { FeedsService } from '../../services/feeds.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'app-feeds-page',
    templateUrl: './feeds-page.component.html',
    styleUrls: ['./feeds-page.component.scss'],
})
export class FeedsPageComponent extends DisposableComponent implements OnInit {
    childFeeds: FeedTreeNode[] = [];
    title: string;
    searchForm: UntypedFormGroup;
    resultsLength = 0;
    wasApplied: boolean = false;
    fetchFeeds$ = new Subject();
    @ViewChild('paginator') paginator: MatPaginator;

    constructor (
        private readonly route: ActivatedRoute,
        private readonly feedsService: FeedsService,
    ) {
        super();
        this.searchForm = new UntypedFormGroup({
            searchInput: new UntypedFormControl(),
        });
    }

    ngOnInit(): void {
        const feedId = this.route.snapshot.paramMap.get('feedId');

        this.feedsService.getFeedDetails(feedId)
        .subscribe((data) => this.title = data.response.title);

        this.fetchFeeds$
        .asObservable()
        .pipe(
            takeUntil(this.destroySignal$),
            startWith([]),
            concatMap((title: string = "") => this.feedsService.getFeeds({
                page: this.paginator?.pageIndex ? this.paginator?.pageIndex + 1 : 1, 
                limit: this.paginator?.pageSize ?? 15, 
                parent_id: feedId, 
                title: title
            }))
        )
        .subscribe((data) => {
            this.childFeeds = data.items;
            this.resultsLength = data.metadata.total;
            this.paginator.pageIndex = data.metadata.page - 1;
        })
    }

    clearSearch() {
        this.searchForm.controls['searchInput'].reset();
        if(this.wasApplied) {
          this.applyFilter();
          this.wasApplied = false;
        }
      }

    applyFilter() {
        this.wasApplied = true;
        this.fetchFeeds$.next(this.searchForm?.value.searchInput ? this.searchForm?.value.searchInput : "");
    }

    handlePageChange() {
        this.fetchFeeds$.next();
    }
}