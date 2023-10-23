import { Component, Inject, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { TranslocoService } from '@ngneat/transloco';
import { NewFeedDialogComponent } from '../new-feed-dialog/new-feed-dialog.component';
import { FeedService } from 'src/app/services/feed.service';
import { NotificationService } from 'src/app/services/general/notification.service';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-update-feed-dialog',
  templateUrl: './update-feed-dialog.component.html',
  styleUrls: ['./update-feed-dialog.component.scss'],
})
export class UpdateFeedDialogComponent implements OnInit {
  feed_form: UntypedFormGroup; // used in html
  navigation_feeds: Feed[] = []; // used in html
  picked_feeds: string[] = []; // used in html
  picked_feeds_id: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      parents: string[];
      kind: string;
      content: string;
    },
    private readonly fb: UntypedFormBuilder,
    private readonly notificationService: NotificationService,
    private readonly feedService: FeedService,
    private translocoService: TranslocoService
  ) {
    dialogRef.disableClose = true;
    this.feed_form = this.fb.group({
      feed_title: [this.data.title, [Validators.required]],
      feed_kind: [this.data.kind, [Validators.required]],
      feed_content: [this.data.content, [Validators.required]],
      feed_parents: [
        this.data.parents.length > 0
          ? this.data.parents[this.data.parents.length - 1]
          : '',
      ],
    });
  }

  ngOnInit(): void {
    this.feedService
      .getFeedsList({
        page: 0,
        limit: 100,
        kind: 'navigation',
        order_by: 'title',
      })
      .subscribe((data) => (this.navigation_feeds = data.items));

    for (let i = 0; i < this.data.parents.length; i++) {
      // push id
      this.picked_feeds_id.push(this.data.parents[i]);
      this.feedService
        .getFeedDetail(this.data.parents[i])
        .subscribe((data) => this.picked_feeds.push(data.response.title)); // push name
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

  // clicked no
  onNoClick(): void {
    this.dialogRef.close('no');
  }

  // clicked yes
  onYesClick(): void {
    const { value, valid } = this.feed_form;
    if (valid) {
      // set parents to picked ones
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
