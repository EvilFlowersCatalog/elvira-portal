import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute } from '@angular/router';
import { EntriesService } from '../../services/entries.service';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { State } from 'src/app/common/types/app-state.types';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { DownloadUserAcquistionWithQuery } from '../../types/library.types';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PdfViewerComponent extends DisposableComponent implements OnInit {
  public base64: string;
  public appState$: Observable<State>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly entriesService: EntriesService,
    private appStateService: AppStateService
  ) {
    super();
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  ngOnInit(): void {
    const userAcquisitionID = this.route.snapshot.paramMap.get('userAcquisitionID');
    this.entriesService
      .donwloadUserAcquisition(userAcquisitionID, 'base64')
      .subscribe(
        (data: DownloadUserAcquistionWithQuery) => {
          this.base64 = data.response.data;
        }
      );

    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }
}
