import { Component, OnInit, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/services/general/notification.service';
import { FeedService } from 'src/app/services/feed.service';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-new-feed-dialog',
  templateUrl: './new-feed-dialog.component.html',
  styleUrls: ['./new-feed-dialog.component.scss'],
})
export class NewFeedDialogComponent implements OnInit {
  feed_form: UntypedFormGroup; // used in html
  navigation_feeds: Feed[] = []; // used in html
  picked_feeds: string[] = []; // used in html
  picked_feeds_id: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { parent_id: string; parent_name: string },
    private readonly fb: UntypedFormBuilder,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly feedService: FeedService
  ) {
    dialogRef.disableClose = true;
    this.feed_form = this.fb.group({
      feed_title: ['', [Validators.required]],
      feed_kind: [null, [Validators.required]],
      feed_content: ['', [Validators.required]],
      feed_parents: [this.data.parent_id === 'null' ? '' : this.data.parent_id],
    });
  }

  ngOnInit(): void {
    // Get all navigation feeds
    this.feedService
      .getFeedsList({
        page: 0,
        limit: 100,
        kind: 'navigation',
        order_by: 'title',
      })
      .subscribe((data) => (this.navigation_feeds = data.items));

    // Set already used parent, if there is one
    if (this.data.parent_id !== 'null') {
      this.addFeed({ title: this.data.parent_name, id: this.data.parent_id });
    }
  }

  // add new parents
  addFeed(feed: { title: string; id: string }) {
    if (!this.picked_feeds.includes(feed.title)) {
      this.picked_feeds.push(feed.title);
      this.picked_feeds_id.push(feed.id);
    }
  }

  // Clear everything (option empty)
  clearEverything() {
    this.picked_feeds = [];
    this.picked_feeds_id = [];
  }

  // remove feed
  removeFeed(feed_name: string) {
    const index = this.picked_feeds.indexOf(feed_name);
    this.picked_feeds.splice(index, 1);
    this.picked_feeds_id.splice(index, 1);
  }

  // If close return no
  onNoClick(): void {
    this.dialogRef.close('no');
  }

  // if create return values
  onYesClick(): void {
    const { value, valid } = this.feed_form;
    if (valid) {
      // set value of parents
      value.feed_parents = this.picked_feeds_id;
      this.dialogRef.close(value);
    } else {
      const message = this.translocoService.translate(
        'lazy.newFeedDialog.requiredFieldEmptyMessage'
      );
      this.notificationService.error(message);
    }
  }
}
