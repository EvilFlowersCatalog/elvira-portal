import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/common/services/notification.service';
import { NewFeedDialogComponent } from '../new-feed-dialog/new-feed-dialog.component';

@Component({
  selector: 'app-update-feed-dialog',
  templateUrl: './update-feed-dialog.component.html',
  styleUrls: ['./update-feed-dialog.component.scss'],
})
export class UpdateFeedDialogComponent implements OnInit {
  newFeedForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { parentName: string },
    private readonly fb: FormBuilder,
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
