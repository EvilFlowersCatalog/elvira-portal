import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
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
export class AddFeedDialogComponent
  extends DisposableComponent
  implements OnInit
{
  data_source: { title: string; id: string }[] = []; // used in html
  filteredFeeds: { title: string; id: string }[] = []; // used in html
  fetchFeeds$ = new Subject();
  search_form: UntypedFormGroup; // used in html
  was_aplied: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<AddFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: void,
    private readonly feedService: FeedService
  ) {
    super();
    dialogRef.disableClose = true;
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });

    // Subscribe to changes in the search_input control
    this.search_form
      .get('search_input')
      .valueChanges.subscribe((searchInputValue: string) => {
        this.filteredFeeds = this.data_source.filter((feed) => {
          return feed.title
            .toLocaleLowerCase()
            .includes(searchInputValue.toLocaleLowerCase());
        });
      });
  }

  ngOnInit(): void {
    // Get acquisition feeds as observable, cuz we will be changing it with search form

    this.feedService
      .getFeedsList({
        page: 0,
        limit: 1000, // theres no way there is more feeds than 1000, (i need all)
        title: '',
        kind: 'acquisition',
        order_by: '-created_at',
      })
      .subscribe((data) => {
        this.data_source = data.items;
        this.filteredFeeds = data.items;
      });
  }

  // feed was choose
  onYesClick(feed: Feed): void {
    this.dialogRef.close({ title: feed.title, id: feed.id }); // return it
  }
}
