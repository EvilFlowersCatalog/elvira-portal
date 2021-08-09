import { Component, Input, OnInit } from '@angular/core';
import { EntriesItem } from '../../services/entries/entries.types';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  imageSrc: string;
  year: string;

  constructor() {}

  ngOnInit(): void {
    this.imageSrc =
      this.entry.img === 'none'
        ? 'default'
        : `data:image/png;base64,${this.entry.img}`;
    this.year = DateTime.fromISO(this.entry.created_at).year;
  }

  openPdf(id: string) {
    console.log('openPdf', id);
    // this.router.navigateByUrl(`/library/pdf-viewer/${id}`);
  }

  downloadPdf(id: string) {
    console.log('downloadPdf', id);
  }

  addToFavorites(id: string) {
    console.log('addToFavorites', id);
  }
}
