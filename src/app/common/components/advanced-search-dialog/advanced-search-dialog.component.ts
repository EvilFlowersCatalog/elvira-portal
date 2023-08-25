import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { Filters } from 'src/app/types/general.types';
import { DisposableComponent } from '../disposable.component';
import { FeedService } from 'src/app/services/feed.service';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-advanced-search-dialog',
  templateUrl: './advanced-search-dialog.component.html',
  styleUrls: ['./advanced-search-dialog.component.scss'],
})

export class AdvancedSearchDialogComponent extends DisposableComponent implements OnInit {
  advanced_form: UntypedFormGroup;
  search_form: UntypedFormGroup;
  data_source: { title: string, id: string }[] = []; // used in html
  fetchFeeds$ = new Subject();
  picked_feed = { title: '', id: '' }
  was_aplied: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private readonly router: Router,
    private readonly feedService: FeedService,
  ) {
    super();
    this.advanced_form = new UntypedFormGroup({
      title: new UntypedFormControl(''),
      author: new UntypedFormControl(''),
      from: new UntypedFormControl(''),
      to: new UntypedFormControl(''),
      feed: new UntypedFormControl('')
    });

    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl('')
    })
  }

  ngOnInit(): void {
    this.fetchFeeds$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap((title: string = "") => this.feedService.getFeedsList({
          page: 0,
          limit: 200,
          title: title,
          kind: "acquisition"
        }))
      )
      .subscribe((data) => {
        this.data_source = data.items;
      });
  }

  // search, set new data to filter and move to library
  search() {
    this.router.navigateByUrl(`elvira/library/${new Filters(this.advanced_form?.value.title ?? '', this.advanced_form?.value.author ?? '', this.picked_feed.id ?? '').getFilters()}`);
  }

  // Search feeds
  searchFeed() {
    if (this.search_form?.value.search_input) { // if there is something
      this.fetchFeeds$.next(this.search_form?.value.search_input);
      this.was_aplied = true;
    }
    else if (this.was_aplied) { // if search input is empty, but some title was aplied
      this.fetchFeeds$.next();
      this.was_aplied = false;
    }
  }

  pick(feed: Feed) {
    this.picked_feed.title = feed.title;
    this.picked_feed.id = feed.id;
  }
}
