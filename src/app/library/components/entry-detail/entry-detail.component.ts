import { Component, Input, OnInit } from '@angular/core';
import { EntriesItem } from '../../services/entries/entries.types';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  imageSrc: string;

  constructor() {}

  ngOnInit(): void {
    this.imageSrc =
      this.entry.img === 'none'
        ? 'default'
        : `data:image/png;base64,${this.entry.img}`;
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
