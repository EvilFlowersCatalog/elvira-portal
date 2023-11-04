import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { TranslocoService } from '@ngneat/transloco';
import { Entry } from 'src/app/types/entry.types';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { Filters } from 'src/app/types/general.types';
import { MyShelfService } from 'src/app/services/my-shelf.service';
import { catchError, take, tap } from 'rxjs/operators';
import { NotificationService } from 'src/app/services/general/notification.service';
import { throwError } from 'rxjs';
import { MyShelfCounterService } from 'src/app/services/general/my-shelf-count.service';

@Component({
  selector: 'app-entry-detail',
  templateUrl: './entry-detail.component.html',
  styleUrls: ['./entry-detail.component.scss'],
})
export class EntryDetailComponent {
  @Input() entry: Entry;
  @Input() titleRow: boolean = false;
  @Input() show: boolean = false;
  @Output() onLikedChange = new EventEmitter<boolean>();

  constructor(
    private readonly navigationService: NavigationService,
    public dialog: MatDialog,
    private translocoService: TranslocoService,
    private readonly notificationService: NotificationService,
    private readonly myShelfCounterService: MyShelfCounterService,
    private readonly myShelfService: MyShelfService
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

  // Add entry to MyShelf
  addToMyShelf(entry_id: string) {
    // Call func for adding to MyShelf
    this.myShelfService
      .addEntryToMyShelf({ entry_id: entry_id })
      .pipe(
        tap(() => {
          // if it was succesfull
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToMyShelfsSuccessMessage'
          );
          this.notificationService.success(message);

          // Patch count for MyShelfs
          this.myShelfCounterService.increment(entry_id);
          this.onLikedChange.emit(true);
        }),
        take(1),
        catchError((err) => {
          // if not
          const message = this.translocoService.translate(
            'lazy.entryDetail.addToMyShelfsErrorMessage'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();
  }

  // Function for removing from MyShelf
  removeFromMyShelf(shelfRecordId: string, entry_id: string) {
    // Function for calling remove from MyShelf
    this.myShelfService
      .removeFromMyShelf(shelfRecordId)
      .pipe(
        tap(() => {
          // if successfull
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromMyShelfsSuccessMessage'
          );
          this.notificationService.success(message);

          // Patch count for MyShelfs
          this.myShelfCounterService.decrement(entry_id);

          this.onLikedChange.emit(true);
        }),
        take(1),
        catchError((err) => {
          // if not
          const message = this.translocoService.translate(
            'lazy.entryDetail.removeFromMyShelfsErrorMessage'
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
