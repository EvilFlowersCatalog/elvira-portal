import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntriesService } from '../../services/entries.service';
import { Router } from '@angular/router';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { catchError, take, tap } from 'rxjs/operators';
import { GdriveService } from '../../services/gdrive.service';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { Observable, throwError } from 'rxjs';
import { NotificationService } from 'src/app/common/services/notification.service';
import { TranslocoService } from '@ngneat/transloco';
import { EntriesItem, EntryDetail } from '../../types/library.types';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent implements OnInit {
  @Input() entry: EntriesItem;
  @Output() onDeleteFromFavorites = new EventEmitter<any>();
  imageSrc: string;
  currentRoute = this.router.url;
  entryDetail$: Observable<EntryDetail>;

  constructor(
    private readonly router: Router,
    private readonly gdriveService: GdriveService,
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly entriesService: EntriesService
  ) {}

  ngOnInit(): void {
    this.imageSrc = this.entry.thumbnail;
  }

  openPdf(catalogID: string, entryID: string) {
    this.entriesService
      .entryDetail(catalogID, entryID)
      .toPromise()
      .then((entryDetail) => {
        const acquisitionID = entryDetail.response.acquisitions[0].id;
        this.router.navigateByUrl(`/library/pdf-viewer/${acquisitionID}`);
      });
  }

  showInfo(catalogID: string, entryID: string) {
    this.dialog.open(EntryInfoDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: { catalogID, entryID },
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
    this.entriesService
      .addEntryToFavorites(id)
      .pipe(
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToFavoritesSuccessMessage'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToFavoritesErrorMessage'
          );
          this.notificationService.info(message);
          return throwError(err);
        })
      )
      .subscribe();
  }

  deleteFromFavorites(id: string) {
    this.entriesService
      .deleteFromFavorites(id)
      .pipe(
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromFavoritesSuccessMessage'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromFavoritesErrorMessage'
          );
          this.notificationService.info(message);
          return throwError(err);
        })
      )
      .subscribe(() => this.onDeleteFromFavorites.emit());
  }
}
