import { AfterViewInit, Component, Input, OnChanges } from '@angular/core';
import { renderViewer } from '../../../../../../EvilFlowersViewer/dist/evilFlowersViewer.es.js';

@Component({
  selector: 'evil-flowers-viewer-wrapper',
  template: `<div [id]="rootId"></div>`,
  styleUrls: ['../../../../../../EvilFlowersViewer/dist/style.css']
})
export class AppWrapperComponent implements OnChanges, AfterViewInit {
  @Input() base64: string;

  public rootId = 'evilFLowersViewer-root';
  private hasViewLoaded = false;

  public ngOnChanges() {
    console.log('test changed');
    this.renderComponent();
  }

  public ngAfterViewInit() {
    console.log('test init');
    this.hasViewLoaded = true;
    this.renderComponent();
  }

  private renderComponent() {
    console.log('test render');
    if (!this.hasViewLoaded) {
      return;
    }

    renderViewer(this.rootId, this.base64)
    console.log('test rendered');
  }
}
