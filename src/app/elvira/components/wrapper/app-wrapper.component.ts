import { AfterViewInit, Component, Input, OnChanges } from '@angular/core';
import { renderViewer } from '@evilflowers/evilflowersviewer';

@Component({
  selector: 'evil-flowers-viewer-wrapper',
  template: `<div [id]="root_id"></div>`,
  styleUrls: ['../../../../../node_modules/@evilflowers/evilflowersviewer/dist/styles.css']
})
export class AppWrapperComponent implements OnChanges, AfterViewInit {
  @Input() base64: string;

  public root_id = 'evilFLowersViewer-root'; // used in html
  private has_view_loaded = false;

  public ngOnChanges() {
    console.log('test changed');
    this.renderComponent();
  }

  public ngAfterViewInit() {
    console.log('test init');
    this.has_view_loaded = true;
    this.renderComponent();
  }

  private renderComponent() {
    console.log('test render');
    if (!this.has_view_loaded) {
      return;
    }

    renderViewer(this.root_id, this.base64)
    console.log('test rendered');
  }
}
