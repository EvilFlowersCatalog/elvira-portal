import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Entry } from 'src/app/types/entry.types';

@Component({
  selector: 'app-admin-entry-detail',
  templateUrl: './admin-entry-detail.component.html',
  styleUrls: ['./admin-entry-detail.component.scss'],
})
export class AdminEntryDetailComponent implements OnInit {
  @Input() entry: Entry;
  @Output() editClicked = new EventEmitter<Entry>();
  @Output() deleteClicked = new EventEmitter<Entry>();
  imageSrc: string;
  currentRoute = this.router.url;
  entryDetail$: Observable<Entry>;

  constructor(
    private readonly router: Router,
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.imageSrc = this.entry.thumbnail;
  }

  onEditClick() {
    this.editClicked.emit(this.entry);
  }

  onDeleteClick() {
    this.deleteClicked.emit(this.entry);
  }
}
