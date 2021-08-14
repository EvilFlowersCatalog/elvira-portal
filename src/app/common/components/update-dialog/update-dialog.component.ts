import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AdminService } from 'src/app/admin/services/admin.service';
import { AllFeedsItems, UpdateFeeds } from 'src/app/admin/services/admin.types';

export interface DialogData {
  feedId: string;
  oldFeed: string;
  newFeed: string;
  catalogId: string;
  url: string;
  content: string;
  kind: string;
}

@Component({
  selector: 'app-update-dialog',
  templateUrl: './update-dialog.component.html',
  styleUrls: ['./update-dialog.component.scss']
})


export class UpdateDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<UpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly adminService: AdminService,
  ) {}

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClcik(): void {
    // console.log("HOOOA");
    // console.log(this.data.newFeed);
    this.adminService.updateFeed(this.data.feedId, this.getFeedsData()).subscribe();
    this.dialogRef.close();
  }

  getFeedsData() {
    const feedsData: UpdateFeeds = {
        catalog_id: this.data.catalogId,
        title: this.data.newFeed,
        url_name: this.data.url,
        content: this.data.content,
        kind: this.data.kind
    }
    return feedsData;
  }
}
