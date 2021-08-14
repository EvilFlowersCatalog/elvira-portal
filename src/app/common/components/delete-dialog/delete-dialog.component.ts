import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { AdminService } from 'src/app/admin/services/admin.service';
import { DialogData } from 'src/app/admin/services/admin.types';

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
  ) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClcik(): void {
    if(this.data.source === "admin"){
      this.adminService.deleteEntry(this.data.entryApikey).subscribe();
    }
    if(this.data.source === "feed"){
      this.adminService.deleteFeed(this.data.entryApikey).subscribe();
    }
    this.dialogRef.close();
  }
}
