import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { FeedService } from 'src/app/services/feed.service';
import { Filters } from 'src/app/types/general.types';

@Component({
  selector: 'app-filter-dialog',
  templateUrl: './filter-dialog.component.html',
  styleUrls: ['./filter-dialog.component.scss'],
})
export class FilterDialogComponent {
  title: string;
  author: string;
  feed: string;
  from: string;
  to: string;

  constructor(
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    private readonly feedService: FeedService,
    @Inject(MAT_DIALOG_DATA) public data: { filters: Filters }
  ) {
    // set info
    this.title = this.data.filters.title ?? '';
    this.author = this.data.filters.author ?? '';
    this.from = this.data.filters.from ?? '';
    this.to = this.data.filters.to ?? '';
    if (this.data.filters.feed) {
      this.feedService
        .getFeedDetail(this.data.filters.feed)
        .subscribe((data) => {
          this.feed = data.response.title;
        });
    }
  }

  // If close return no
  onNoClick(): void {
    this.dialogRef.close('no');
  }

  // delete, create new empty filters and return
  onDelete(): void {
    this.dialogRef.close(new Filters());
  }

  // update filters
  onUpdate(): void {
    this.dialogRef.close(
      new Filters(
        this.title,
        this.author,
        this.feed,
        this.splitPublish(this.from),
        this.splitPublish(this.to)
      )
    );
  }

  // Remove filter based on type
  removeFilter(type: string) {
    if (type === 'title') {
      this.title = '';
    } else if (type === 'author') {
      this.author = '';
    } else if (type === 'from') {
      this.from = '';
    } else if (type === 'to') {
      this.to = '';
    }
  }

  // get if the filters are empty, means there are no filter
  isEmpty(): boolean {
    if (this.title || this.author || this.feed || this.from || this.to) {
      return false;
    }
    return true;
  }

  splitPublish(date: string) {
    if (!date) return [];
    return date.split('-');
  }
}
