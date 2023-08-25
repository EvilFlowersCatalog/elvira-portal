import { HostListener, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private readonly router: Router) { }

  // Navigation with possibility to open with new tab
  modifiedNavigation(link: string, event: PointerEvent | MouseEvent = null) {
    // handle ctrl + left click or middle click
    event?.preventDefault();
    if (event?.ctrlKey || event?.button === 1) { // 1 indicates middle
      window.open(this.router.serializeUrl(this.router.createUrlTree([link])), '_blank');
    } else {
      this.router.navigateByUrl(link);
    }
  }
}