import { Component, OnInit} from '@angular/core'
import { ActivatedRoute } from '@angular/router';
import { FeedDetailRespone, FeedTreeNode, ListFeedsResponse } from '../../types/library.types';
import { FeedsService } from '../../services/feeds.service';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';

@Component({
    selector: 'app-feeds-page',
    templateUrl: './feeds-page.component.html',
    styleUrls: ['./feeds-page.component.scss'],
})
export class FeedsPageComponent extends DisposableComponent implements OnInit {
    childFeeds: FeedTreeNode[] = [];
    title: string;
    searchForm: UntypedFormGroup;
    wasApplied: boolean = false;
    fetchFeeds$ = new Subject();

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
            concatMap((title: string) => this.feedsService.getFeeds({page: 1, limit: 100, parent_id: feedId, title: title}))
        )
        .subscribe((data) => {
            this.childFeeds = data.items;
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
}