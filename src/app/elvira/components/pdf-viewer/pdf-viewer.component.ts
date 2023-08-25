import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute, Router } from '@angular/router';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AcquisitionService } from 'src/app/services/acquisition.service';
import { UserAcquisition, UserAcquisitionId } from 'src/app/types/acquisition.types';
import { EntryService } from 'src/app/services/entry.service';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/services/general/notification.service';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PdfViewerComponent extends DisposableComponent implements OnInit {
  public base64: string;
  user_acquisition_id: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly acquisitionService: AcquisitionService,
    private readonly entryService: EntryService,
    private translocoService: TranslocoService,
    private readonly notificationService: NotificationService,
    private readonly router: Router,
  ) {
    super();
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  async ngOnInit(): Promise<void> {
    const entry_id = this.route.snapshot.paramMap.get('entry_id');

    await this.entryService
      .getEntryDetail(entry_id)
      .toPromise()
      .then(async (entryDetail) => {
        // Create user acquisition
        const userAcquisition: UserAcquisition = {
          acquisition_id: entryDetail.response.acquisitions[0].id,
          type: "personal"
        }
        // create user acquisition
        await this.acquisitionService
          .createUserAcquisition(userAcquisition)
          .toPromise()
          .then((res: UserAcquisitionId) => {
            // get id 
            this.user_acquisition_id = res.response.id;
          })
          .catch(() => {
            // If something went wrong
            const message = this.translocoService.translate(
              'lazy.pdfViewer.somethingWentWrong'
            );
            this.notificationService.error(message);
            this.router.navigateByUrl('elvira/home');
          })
      })
      .catch(() => {
        console.log("ahoj");
        // If something went wrong
        const message = this.translocoService.translate(
          'lazy.pdfViewer.somethingWentWrong'
        );
        this.notificationService.error(message);
        this.router.navigateByUrl('elvira/home');
      });

    // Get base64 file from BE 
    if (this.user_acquisition_id) {
      this.acquisitionService
        .getUserAcquisition(this.user_acquisition_id, 'base64')
        .subscribe((data) => { this.base64 = data.response.data; });
    }
  }
}
