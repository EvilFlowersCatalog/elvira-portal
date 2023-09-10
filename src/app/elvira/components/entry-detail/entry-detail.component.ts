import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { TranslocoService } from '@ngneat/transloco';
import { Entry } from 'src/app/types/entry.types';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { Filters, State } from 'src/app/types/general.types';
import { FavoriteService } from 'src/app/services/favorite.service';
import { catchError, take, tap } from 'rxjs/operators';
import { NotificationService } from 'src/app/services/general/notification.service';
import { throwError } from 'rxjs';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { FavoriteCounterService } from 'src/app/services/general/favorite-count.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent {
  @Input() entry: Entry;
  @Input() show: Boolean;
  @Output() onLikedChange = new EventEmitter<boolean>();

  constructor(
    private readonly navigationService: NavigationService,
    public dialog: MatDialog,
    private translocoService: TranslocoService,
    private readonly notificationService: NotificationService,
    private readonly favoriteCounterService: FavoriteCounterService,
    private readonly favoriteService: FavoriteService
  ) {}

  // Open pdf
  openPdf(entry_id: string, event: any) {
    this.navigationService.modifiedNavigation(
      `/elvira/pdf-viewer/${entry_id}`,
      event
    );
  }

  // Show info dialog
  showInfo(entry_id: string) {
    this.dialog.open(EntryInfoDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: { entry_id },
    });
  }

  // Add entry to favorite
  addToFavorite(entry_id: string) {
    // Call func for adding to favorite
    this.favoriteService
      .addEntryToFavorites({ entry_id: entry_id })
      .pipe(
        tap(() => {
          // if it was succesfull
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToFavoritesSuccessMessage'
          );
          this.notificationService.success(message);

          // Patch count for favorites
          this.favoriteCounterService.increment(entry_id);
          this.onLikedChange.emit(true);
        }),
        take(1),
        catchError((err) => {
          // if not
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToFavoritesErrorMessage'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();
  }

  // Function for removing from favorite
  removeFromFavorite(shelfRecordId: string, entry_id: string) {
    // Function for calling remove from favorites
    this.favoriteService
      .removeFromFavorites(shelfRecordId)
      .pipe(
        tap(() => {
          // if successfull
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromFavoritesSuccessMessage'
          );
          this.notificationService.success(message);

          // Patch count for favorites
          this.favoriteCounterService.decrement(entry_id);

          this.onLikedChange.emit(true);
        }),
        take(1),
        catchError((err) => {
          // if not
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromFavoritesErrorMessage'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();
  }

  navigate(feed_id: string, event: any) {
    this.navigationService.modifiedNavigation(
      `elvira/library/${new Filters('', '', feed_id).getFilters()}`,
      event
    );
  }
}
