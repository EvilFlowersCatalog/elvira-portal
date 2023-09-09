import { AfterViewInit, Component, Input, OnChanges } from '@angular/core';
import { AcquisitionService } from 'src/app/services/acquisition.service';
import { UserAcquisitionAbsoluteUrl, UserAcquisitionShare } from 'src/app/types/acquisition.types';
//import { renderViewer } from '@evilflowers/evilflowersviewer';
import { renderViewer } from '../../../../../../../Elvira-viewer/EvilFlowersViewer/src/lib/components/Viewer';

@Component({
  selector: 'evil-flowers-viewer-wrapper',
  template: `<div [id]="rootId"></div>`,
  //styleUrls: ['../../../../../node_modules/@evilflowers/evilflowersviewer/dist/styles.css']
})
export class AppWrapperComponent implements OnChanges, AfterViewInit {
  @Input() base64: string;
  @Input() acquisitionId: string;
  @Input() citation: string | null;
  public rootId = 'pdf-viewer-wrapper'; // used in html
  private hasViewLoaded = false;

  constructor(private readonly acquisitionService: AcquisitionService) { }

  public ngOnChanges() {
    this.renderComponent();
  }

  public ngAfterViewInit() {
    this.hasViewLoaded = true;
    this.renderComponent();
  }

  private renderComponent() {
    if (!this.hasViewLoaded) {
      return;
    }
    // evil flowers viewer render func
    renderViewer(this.rootId, this.base64, { shareFunction: this.shareFunction });
  }

  /**
   * Function which is used in evil flowers viewer
   * @param pages given selected pages
   * @param expireDate date of lifespsan end
   * @returns url for download shared documet
   */
  private shareFunction = async (pages: string | null, expireDate: string) => {
    // creat share user acquistion object
    const userAcquisitionShare: UserAcquisitionShare = {
      acquisition_id: this.acquisitionId,
      range: pages,
      type: 'shared',
      expires_at: expireDate
    }
    console.log(userAcquisitionShare);
    let link = '';

    // create user acquistion and get url
    await this.acquisitionService
      .createUserAcquisition(userAcquisitionShare)
      .toPromise()
      .then((res: UserAcquisitionAbsoluteUrl) => {
        link = res.response.url;
      })
      .catch((err) => {
        console.log('Error:', err);
      })

    return '';
  }
}
