import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/common/services/notification.service';
import { NewFeedDialogComponent } from '../new-feed-dialog/new-feed-dialog.component';

@Component({
  selector: 'app-update-feed-dialog',
  templateUrl: './update-feed-dialog.component.html',
  styleUrls: ['./update-feed-dialog.component.scss'],
})
export class UpdateFeedDialogComponent implements OnInit {
  newFeedForm: UntypedFormGroup;

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { parentName: string },
    private readonly fb: UntypedFormBuilder,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    dialogRef.disableClose = true;
    this.newFeedForm = this.fb.group({
      feedTitle: ['', [Validators.required]],
      feedKind: [null, [Validators.required]],
      feedsParentName: [{ value: this.data.parentName, disabled: true }],
    });
  }

  ngOnInit(): void {}

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
