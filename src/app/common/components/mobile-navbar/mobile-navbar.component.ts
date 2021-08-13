import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';

@Component({
  selector: 'app-mobile-navbar',
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.scss'],
})
export class MobileNavbarComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy() {
    this.appStateService.patchState({ sidenav: false });
  }

  toggleSidenav() {
    const currentSidenavState = this.appStateService.getStateSnapshot().sidenav;
    this.appStateService.patchState({ sidenav: !currentSidenavState });
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }
}
