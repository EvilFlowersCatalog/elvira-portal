import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EntryDetail } from '../../services/entries/entries.types';

@Component({
  selector: 'app-entry-info-dialog',
  templateUrl: './entry-info-dialog.component.html',
  styleUrls: ['./entry-info-dialog.component.scss'],
})
export class EntryInfoDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EntryInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EntryDetail
  ) {}

  ngOnInit(): void {
    console.log(this.data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
