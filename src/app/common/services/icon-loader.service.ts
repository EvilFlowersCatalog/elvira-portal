import { Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

const ICONS = ['google'];

@Injectable({
  providedIn: 'root',
})
export class IconLoaderService {
  constructor(
    private readonly matIconRegistry: MatIconRegistry,
    private readonly domSanitizer: DomSanitizer
  ) {}

  loadIcons() {
    ICONS.forEach((icon) => this.loadIcon(icon));
  }

  loadIcon(name: string, path = '') {
    this.matIconRegistry.addSvgIcon(
      name,
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        environment.assetsUrl + '/icons/' + path + name + '.svg'
      )
    );
  }
}
