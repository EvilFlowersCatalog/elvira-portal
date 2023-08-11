import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AllEntryItems, EntriesItem, OneEntryItem } from '../../types/admin.types';

@Component({
  selector: 'app-admin-entry-detail',
  templateUrl: './admin-entry-detail.component.html',
  styleUrls: ['./admin-entry-detail.component.scss'],
})
export class AdminEntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  @Output() editClicked = new EventEmitter<AllEntryItems>();
  @Output() deleteClicked = new EventEmitter<AllEntryItems>(); 
  imageSrc: string;
  currentRoute = this.router.url;
  entryDetail$: Observable<OneEntryItem>;

  constructor(
    private readonly router: Router,
    public dialog: MatDialog,
  ) {}

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
