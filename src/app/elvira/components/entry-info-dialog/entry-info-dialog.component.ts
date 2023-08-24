import { Component, OnInit, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Observable } from 'rxjs';
import { EntryService } from 'src/app/services/entry.service';
import { EntryDetail } from 'src/app/types/entry.types';

@Component({
  selector: 'app-entry-info-dialog',
  templateUrl: './entry-info-dialog.component.html',
  styleUrls: ['./entry-info-dialog.component.scss'],
})
export class EntryInfoDialogComponent implements OnInit {
  entryDetail$: Observable<EntryDetail>; // Used in html

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { entry_id: string },
    private readonly entryService: EntryService
  ) { }

  ngOnInit(): void {
    this.entryDetail$ = this.entryService.getEntryDetail(this.data.entry_id);
  }
}
