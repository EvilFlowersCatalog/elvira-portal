import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Subject } from 'rxjs';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { FeedService } from 'src/app/services/feed.service';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-add-feed-dialog',
  templateUrl: './add-feed-dialog.component.html',
  styleUrls: ['./add-feed-dialog.component.scss'],
})
export class AddFeedDialogComponent extends DisposableComponent implements OnInit {
  data_source: { title: string, id: string }[] = []; // used in html
  fetchFeeds$ = new Subject();
  search_form: UntypedFormGroup; // used in html
  was_aplied: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: void,
    private readonly feedService: FeedService,
  ) {
    super();
    dialogRef.disableClose = true;
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    })
  }

  ngOnInit(): void {
    // Get acquisition feeds as observable, cuz we will be changing it with search form
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

  // feed was choose
  onYesClick(feed: Feed): void {
    this.dialogRef.close({ title: feed.title, id: feed.id }); // return it
  }

  // For searching feeds
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
}
