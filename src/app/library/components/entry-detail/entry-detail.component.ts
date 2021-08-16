import { Component, Input, OnInit } from '@angular/core';
import { EntriesItem, EntryDetail } from '../../services/entries/entries.types';
import { DateTime } from 'luxon';
import { MatDialog } from '@angular/material/dialog';
import { EntriesService } from '../../services/entries/entries.service';
import { Router } from '@angular/router';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  imageSrc: string;
  year: string;

  constructor(
    private readonly entriesService: EntriesService,
    private readonly router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.imageSrc =
      this.entry.img === 'none'
        ? 'default'
        : `data:image/png;base64,${this.entry.img}`;
    this.year = DateTime.fromISO(this.entry.created_at).year;
  }

  openPdf(id: string) {
    this.router.navigateByUrl(`/library/pdf-viewer/${id}`);
  }

  showInfo(id: string) {
    let entryDetail: EntryDetail;
    this.entriesService
      .entryDetail(id)
      .subscribe((data: EntryDetail) => (entryDetail = data));
    this.dialog.open(EntryInfoDialogComponent, {
      width: '350px',
      data: entryDetail,
    });
  }

  downloadPdf(id: string) {
    console.log('downloadPdf', id);
  }

  addToFavorites(id: string) {
    console.log('addToFavorites', id);
  }
}
