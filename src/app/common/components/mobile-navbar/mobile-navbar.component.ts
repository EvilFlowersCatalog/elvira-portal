import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DisposableComponent } from '../disposable.component';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { State } from 'src/app/types/general.types';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { FilterService } from 'src/app/services/general/filter.service';

@Component({
  selector: 'app-mobile-navbar',
  templateUrl: './mobile-navbar.component.html',
  styleUrls: ['./mobile-navbar.component.scss'],
})
export class MobileNavbarComponent
  extends DisposableComponent
  implements OnInit {
  appState$: Observable<State>; // used in html
  search_form: UntypedFormGroup; // used in html

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    private readonly filterService: FilterService,
  ) {
    super();
    this.search_form = new UntypedFormGroup({
      search_input: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
  }

  // Hide sidenav
  ngOnDestroy() {
    this.appStateService.patchState({ sidenav: false });
  }

  // Show sidenav
  toggleSidenav() {
    const currentSidenavState = this.appStateService.getStateSnapshot().sidenav;
    this.appStateService.patchState({ sidenav: !currentSidenavState });
  }

  // Navigation for buttons
  navigate(link: string) {
    this.router.navigate([link]);
  }

  // Submit... clear search input and navigate
  submit() {
    if (this.search_form?.value.search_input) {
      this.filterService.setTitle(this.search_form.value.search_input)
      this.search_form.controls['search_input'].reset();
      this.navigate('library/all-entries');
    }
  }
}
