import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/common/services/notification.service';
import { NewFeedDialogComponent } from '../new-feed-dialog/new-feed-dialog.component';
import { FeedTreeNode } from 'src/app/admin/types/admin.types';
import { AdminService } from 'src/app/admin/services/admin.service';
import { FeedsService } from 'src/app/library/services/feeds.service';

@Component({
  selector: 'app-update-feed-dialog',
  templateUrl: './update-feed-dialog.component.html',
  styleUrls: ['./update-feed-dialog.component.scss'],
})
export class UpdateFeedDialogComponent implements OnInit {
  newFeedForm: UntypedFormGroup;
  navigationFeeds: FeedTreeNode[] = [];

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, parentId: string, kind: string, content: string },
    private readonly fb: UntypedFormBuilder,
    private readonly notificationService: NotificationService,
    private readonly feedsService: FeedsService,
    private translocoService: TranslocoService
  ) {
    dialogRef.disableClose = true;
    this.newFeedForm = this.fb.group({
      feedTitle: [this.data.title, [Validators.required]],
      feedKind: [this.data.kind, [Validators.required]],
      feedsParentName: [this.data.parentId ? this.data.parentId : ""],
      feedContent: [this.data.content, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.feedsService.getFeeds({page: 1, limit: 100, kind: "navigation"})
    .subscribe((data) => this.navigationFeeds = data.items)
  }

  onNoClick(): void {
    this.dialogRef.close('no');
  }

  onYesClick(): void {
    const { value, valid } = this.newFeedForm;
    if (valid) {
      this.dialogRef.close(value);
    } else {
      const message = this.translocoService.translate(
        'lazy.newFeedDialog.requiredFieldEmptyMessage'
      );
      this.notificationService.error(message);
    }
  }
}
