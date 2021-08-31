import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, take, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AdminService } from 'src/app/admin/services/admin.service';
import { DialogData } from 'src/app/admin/services/admin.types';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { DocumentAddService } from '../../services/document-add.service';
import { FeedAddService } from '../../services/feed-add.service';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly adminService: AdminService,
    private readonly feedService: FeedAddService,
    private readonly documentService: DocumentAddService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClcik(): void {
    if(this.data.source === "admin"){
      this.documentService.deleteValue(this.data.title);
      this.adminService.deleteEntry(this.data.entryApikey).subscribe();
      const message = this.translocoService.translate(
        'lazy.adminPage.success-delete-document'
      );
      this.notificationService.success(message);
      this.dialogRef.close();
    }
    if(this.data.source === "feed"){
      this.feedService.deleteValue(this.data.entryApikey);
      this.adminService.deleteFeed(this.data.entryApikey).subscribe();
    const message = this.translocoService.translate(
      'lazy.adminPage.success-delete-feed'
    );
    this.notificationService.success(message);
    this.dialogRef.close();
    }
  }
}
