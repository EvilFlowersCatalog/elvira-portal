import { Component, Input, OnInit } from '@angular/core';
import { EntriesItem, EntryDetail } from '../../services/entries/entries.types';
import { DateTime } from 'luxon';
import { MatDialog } from '@angular/material/dialog';
import { EntriesService } from '../../services/entries/entries.service';
import { Router } from '@angular/router';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { catchError, take, tap } from 'rxjs/operators';
import { GdriveService } from '../../services/gdrive/gdrive.service';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { throwError } from 'rxjs';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { TranslocoService } from '@ngneat/transloco';
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  imageSrc: string;
  year: string;
  currentRoute = this.router.url;

  constructor(
    private readonly router: Router,
    private readonly gdriveService: GdriveService,
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly entriesService: EntriesService,
    private readonly changeListenerService: ChangeListenerService
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
    this.dialog.open(EntryInfoDialogComponent, {
      width: '350px',
      data: { id },
    });
  }

  addPdfToDrive(entryId: string, catalogId: string) {
    if (this.appStateService.getStateSnapshot().googleAuthed) {
      this.gdriveService
        .uploadFileToDrive(entryId, catalogId)
        .pipe(
          tap(() => {
            const message = this.translocoService.translate(
              'lazy.entryDetail.drive-success-message'
            );
            this.notificationService.success(message);
          }),
          take(1),
          catchError((err) => {
            console.log(err);
            const message = this.translocoService.translate(
              'lazy.entryDetail.drive-error-message'
            );
            this.notificationService.error(message);
            return throwError(err);
          })
        )
        .subscribe();
    } else {
      const message = this.translocoService.translate(
        'lazy.entryDetail.drive-unauthorized-message'
      );
      this.notificationService.info(message);
    }
  }

  addToFavorites(id: string) {
    this.entriesService.addEntryToFavorites(id).subscribe();
  }

  deleteFromFavorites(id: string) {
    this.entriesService.deleteFromFavorites(id).subscribe();
    this.changeListenerService.statusChanged();
  }
}
