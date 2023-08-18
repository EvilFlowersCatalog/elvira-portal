import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute } from '@angular/router';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AcquisitionService } from 'src/app/services/acquisition.service';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PdfViewerComponent extends DisposableComponent implements OnInit {
  public base64: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly acquisitionService: AcquisitionService,
  ) {
    super();
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  ngOnInit(): void {
    const user_acquisition_id = this.route.snapshot.paramMap.get('user_acquisition_id');

    // Get base64 file from BE 
    this.acquisitionService
      .getUserAcquisition(user_acquisition_id, 'base64')
      .subscribe((data) => { this.base64 = data.response.data; });
  }
}
