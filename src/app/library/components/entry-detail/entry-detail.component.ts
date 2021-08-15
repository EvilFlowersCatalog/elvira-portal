import { Component, Input, OnInit } from '@angular/core';
import { EntriesItem } from '../../services/entries/entries.types';
import { DateTime } from 'luxon';
import { EntriesService } from '../../services/entries/entries.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  imageSrc: string;
  year: string;

  constructor(private readonly entriesService: EntriesService) {}

  ngOnInit(): void {
    this.imageSrc =
      this.entry.img === 'none'
        ? 'default'
        : `data:image/png;base64,${this.entry.img}`;
    this.year = DateTime.fromISO(this.entry.created_at).year;
  }

  openPdf(id: string) {
    this.entriesService.entryDetail(id).subscribe((data) => {
      console.log(data);
    });

    // this.router.navigateByUrl(`/library/pdf-viewer/${id}`);
  }

  showInfo(id: string) {
    console.log('showInfo', id);
  }

  downloadPdf(id: string) {
    console.log('downloadPdf', id);
  }

  addToFavorites(id: string) {
    console.log('addToFavorites', id);
  }
}
