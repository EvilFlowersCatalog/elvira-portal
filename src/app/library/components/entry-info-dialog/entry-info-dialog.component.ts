import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EntryDetail } from '../../types/library.types';
import { EntriesService } from '../../services/entries.service';

@Component({
  selector: 'app-entry-info-dialog',
  templateUrl: './entry-info-dialog.component.html',
  styleUrls: ['./entry-info-dialog.component.scss'],
})
export class EntryInfoDialogComponent implements OnInit {
  entryDetail$: Observable<EntryDetail>;

  constructor(
    public dialogRef: MatDialogRef<EntryInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { catalogID: string, entryID: string },
    private readonly entriesService: EntriesService
  ) {}

  ngOnInit(): void {
    this.entryDetail$ = this.entriesService.entryDetail(this.data.catalogID, this.data.entryID);
  }
}
