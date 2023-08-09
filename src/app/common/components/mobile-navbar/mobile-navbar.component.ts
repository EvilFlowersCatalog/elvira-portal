import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { State } from '../../types/app-state.types';
import { DisposableComponent } from '../disposable.component';

@Component({
  selector: 'app-mobile-navbar',
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.scss'],
})
export class MobileNavbarComponent
  extends DisposableComponent
  implements OnInit
{
  appState$: Observable<State>;
  animate: boolean = false;
  public href: string = "";

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.href = window.location.pathname;
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }

  ngOnDestroy() {
    this.appStateService.patchState({ sidenav: false });
  }

  toggleSidenav() {
    this.animate = !this.animate;
    const currentSidenavState = this.appStateService.getStateSnapshot().sidenav;
    this.appStateService.patchState({ sidenav: !currentSidenavState });
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }
}
