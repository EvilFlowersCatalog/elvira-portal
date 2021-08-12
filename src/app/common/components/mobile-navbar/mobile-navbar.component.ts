import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { $ } from 'protractor';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { DisposableComponent } from '../disposable.component';

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
