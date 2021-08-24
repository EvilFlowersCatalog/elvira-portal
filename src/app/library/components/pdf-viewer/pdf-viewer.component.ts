import { Component, OnInit } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute } from '@angular/router';
import { EntriesService } from '../../services/entries/entries.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { DisposableComponent } from 'src/app/common/components/disposable.component';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
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
    const bookId = this.route.snapshot.paramMap.get('id');
    this.entriesService
      .entryDetail(bookId)
      .subscribe(
        (data) => (this.base64 = data.acquisitions[0].content.slice(28))
      );
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }
}
