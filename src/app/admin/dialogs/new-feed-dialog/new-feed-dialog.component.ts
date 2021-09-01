import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AdminService } from 'src/app/admin/services/admin.service';
import { addNewFeed } from 'src/app/admin/services/admin.types';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { AdminOverviewComponent } from '../../admin-overview/admin-overview.component';
import { catchError, take, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-new-feed-dialog',
  templateUrl: './new-feed-dialog.component.html',
  styleUrls: ['./new-feed-dialog.component.scss']
})
export class NewFeedDialogComponent implements OnInit {
  newFeed: string;

  constructor(
    public dialogRef: MatDialogRef<NewFeedDialogComponent>,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close("no");
  }

  onYesClcik(): void {
    this.dialogRef.close(this.newFeed);
  }
}
