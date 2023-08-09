import { Component, OnInit} from '@angular/core'
import { ActivatedRoute } from '@angular/router';
import { FeedDetailRespone } from '../../types/library.types';
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
    childFeeds: FeedDetailRespone[] = [];
    title: string;
    searchForm: UntypedFormGroup;
    wasApplied: boolean = false;
    fetchFeeds$ = new Subject();
    private subscriptions = new Subscription();

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

        this.fetchFeeds$
        .asObservable()
        .pipe(
            takeUntil(this.destroySignal$),
            startWith([]),
            concatMap(() => this.feedsService.getFeedDetails(feedId))
        )
        .subscribe(
            (parentFeed) => {
              this.title = parentFeed.response.title;
              const children = parentFeed.response.children?.map(childId =>
                this.feedsService.getFeedDetails(childId)
              ) || [];
    
              this.subscriptions.add(
                forkJoin(children)
                .subscribe(
                    (childFeeds) => {
                        if(!this.searchForm?.value.searchInput) {
                            this.childFeeds = childFeeds;
                        }
                        else {
                            this.childFeeds = childFeeds.filter((childFeed) =>
                            childFeed.response.title.toLocaleLowerCase().includes(this.searchForm.value.searchInput.toLocaleLowerCase()));
                        }
                    },
                    (err) => {
                        console.log(err);
                    }
                )
              );
            },
            (err) => {
              console.log(err);
            }
        )
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
        this.fetchFeeds$.next();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}