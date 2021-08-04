import { Component, Input, OnInit } from '@angular/core';
import { ListEntriesItem } from '../../services/entries/entries.types';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: ListEntriesItem;

  constructor() {}

  ngOnInit(): void {}

  openPdf(id: string) {
    console.log('openPdf', id);
  }

  downloadPdf(id: string) {
    console.log('downloadPdf', id);
  }

  addToFavorites(id: string) {
    console.log('addToFavorites', id);
  }
}
