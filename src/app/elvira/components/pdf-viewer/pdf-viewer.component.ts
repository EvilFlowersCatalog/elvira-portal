import { Component, OnInit } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute, Router } from '@angular/router';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AcquisitionService } from 'src/app/services/acquisition.service';
import { UserAcquisitionId } from 'src/app/types/acquisition.types';
import { EntryService } from 'src/app/services/entry.service';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/services/general/notification.service';

@Component({
  selector: 'app-pdf-viewer',
  template: `
    <!-- Own loader cuz viewer has it's own and if sharefunction is running, evlira loader and viewer loader are running and it looks weird -->
    <div *ngIf="!base64Loaded; else loadedPdf" class="loader-container">
      <div class="loader"></div>
    </div>

    <!-- Content -->
    <ng-template #loadedPdf>
      <evil-flowers-viewer-wrapper
        [base64]="base64"
        [acquisitionId]="acquisitionId"
        [citation]="citation"
      ></evil-flowers-viewer-wrapper>
    </ng-template>
  `,
  styles: [
    `
      .loader-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }

      .loader {
        border: 5px solid #00bcd4;
        border-top: 5px solid black;
        border-radius: 50%;
        width: 150px;
        height: 150px;
        animation: spin 1s linear infinite;
      }

      /* Loader animation keyframes */
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class PdfViewerComponent extends DisposableComponent implements OnInit {
  public base64: string; // send to wraper
  public base64Loaded: boolean = false; // used in html
  public citation: string | null; // send to wraper
  public acquisitionId: string; // send to wraper

  constructor(
    private readonly route: ActivatedRoute,
    private readonly acquisitionService: AcquisitionService,
    private readonly entryService: EntryService,
    private translocoService: TranslocoService,
    private readonly notificationService: NotificationService,
    private readonly router: Router
  ) {
    super();
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  /**
   * On init
   * Get netry detail based on given entry id
   * Than create user acquisition and get user acquisiton id
   * With user acquisition id get base64 file
   */
  ngOnInit(): void {
    const entry_id = this.route.snapshot.paramMap.get('entry_id'); // get entry id

    try {
      // Get details of given entry id
      this.entryService.getEntryDetail(entry_id).subscribe((entryDetail) => {
        // set info from entry
        this.citation = entryDetail.response.citation
          ? entryDetail.response.citation
          : null;
        this.acquisitionId = entryDetail.response.acquisitions[0].id;

        // Create user acquistion and get user acquistion id of created user acquisition
        this.acquisitionService
          .createUserAcquisition({
            acquisition_id: this.acquisitionId,
            type: 'personal',
          })
          .subscribe((res: UserAcquisitionId) => {
            // Get base64 file from BE
            this.acquisitionService
              .getUserAcquisition(res.response.id, 'base64')
              .subscribe((data) => {
                this.base64 = data.response.data;
                this.base64Loaded = true;
              });
          });
      });
    } catch (error) {
      // If something went wrong
      const message = this.translocoService.translate(
        'lazy.somethingWentWrong'
      );
      this.notificationService.error(message);
      this.router.navigateByUrl('elvira/home');
    }
  }
}
