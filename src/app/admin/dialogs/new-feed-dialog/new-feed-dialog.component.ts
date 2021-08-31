import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AdminService } from 'src/app/admin/services/admin.service';
import { addNewFeed } from 'src/app/admin/services/admin.types';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { AdminOverviewComponent } from '../../admin-overview/admin-overview.component';
import { FeedAddService } from '../../services/feed-add.service';
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
    private readonly feedService: FeedAddService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClcik(): void {
    console.log(this.getFeedData());
    this.feedService.passValue(this.newFeed);
    this.adminService.addNewFeed(this.getFeedData()).subscribe()
    const message = this.translocoService.translate(
      'lazy.adminPage.success-message-feed'
    );
    this.notificationService.success(message);
    this.dialogRef.close();
  }

  getFeedData(){
    const feedData: addNewFeed = {
      catalog_id: "95e2b439-4851-4080-b33e-0adc1fd90196",
      title: this.newFeed,
      url_name: this.newFeed,
      content: "Some popular shit over there",
      kind: "navigation"
    }
    return feedData;
  }
}
