import { Component, OnInit, Inject, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, take, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AdminService } from 'src/app/admin/services/admin.service';
import { DialogData } from 'src/app/admin/services/admin.types';
import { NotificationService } from 'src/app/common/services/notification/notification.service';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close("no");
  }

  onYesClcik(): void {

    this.dialogRef.close("yes");

  }
}
