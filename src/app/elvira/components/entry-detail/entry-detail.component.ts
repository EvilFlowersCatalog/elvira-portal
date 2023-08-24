import { Component, Input, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { EntryInfoDialogComponent } from '../entry-info-dialog/entry-info-dialog.component';
import { TranslocoService } from '@ngneat/transloco';
import { Entry } from 'src/app/types/entry.types';
import { EntryService } from 'src/app/services/entry.service';
import { FilterService } from 'src/app/services/general/filter.service';
import { UserAcquisition, UserAcquisitionId } from 'src/app/types/acquisition.types';
import { AcquisitionService } from 'src/app/services/acquisition.service';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { NotificationService } from 'src/app/services/general/notification.service';
import { NavigationService } from 'src/app/services/general/navigation.service';

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
    private readonly appStateService: AppStateService,
    public dialog: MatDialog,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly entryService: EntryService,
    private readonly filterService: FilterService,
    private readonly acquisitionService: AcquisitionService
  ) { }

  ngOnInit(): void {
    this.image_src = this.entry.thumbnail;
  }

  // Get acquisition id and open pdf
  openPdf(entry_id: string, $event: PointerEvent) {
    this.entryService
      .getEntryDetail(entry_id)
      .toPromise()
      .then((entryDetail) => {
        // Create user acquisition
        const userAcquisition: UserAcquisition = {
          acquisition_id: entryDetail.response.acquisitions[0].id,
          type: "personal"
        }
        // create user acquisition
        this.acquisitionService
          .createUserAcquisition(userAcquisition)
          .toPromise()
          .then((res: UserAcquisitionId) => {
            // When there is a response... move
            this.navigationService.modifiedNavigation(`/elvira/pdf-viewer/${res.response.id}`, $event);
          })
          .catch((err) => {
            console.log(err);
          })
      });
  }

  // Show info dialog
  showInfo(entry_id: string) {
    this.dialog.open(EntryInfoDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: { entry_id },
    });
  }

  navigate(feedId: string) {
    this.filterService.setFeed(feedId);
    this.navigationService.modifiedNavigation(`elvira/library`);
  }
}
