import { Component, Input, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { TranslocoService } from '@ngneat/transloco';
import { Entry } from 'src/app/types/entry.types';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { Filters } from 'src/app/types/general.types';
import { AppStateService } from 'src/app/services/general/app-state.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: Entry;
  image_src: string; // used in html

  constructor(
    private readonly navigationService: NavigationService,
    public dialog: MatDialog,
    private translocoService: TranslocoService,
    private readonly appStateService: AppStateService,
  ) { }

  ngOnInit(): void {
    this.image_src = this.entry.thumbnail;
  }

  // Open pdf
  openPdf(entry_id: string, event: any) {
    this.navigationService.modifiedNavigation(`/elvira/pdf-viewer/${entry_id}`, event);
  }

  // Show info dialog
  showInfo(entry_id: string) {
    this.dialog.open(EntryInfoDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: { entry_id },
    });
  }

  navigate(feed_id: string, event: any) {
    this.navigationService.modifiedNavigation(`elvira/library/${new Filters("", "", feed_id).getFilters()}`, event);
  }
}
