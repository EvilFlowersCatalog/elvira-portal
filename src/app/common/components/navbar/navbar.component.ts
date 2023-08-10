import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { State } from '../../types/app-state.types';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DisposableComponent } from '../disposable.component';
import { Router } from '@angular/router';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { FilterService } from 'src/app/library/services/filter.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent extends DisposableComponent implements OnInit {
  appState$: Observable<State>;
  theme: boolean;
  searchForm: UntypedFormGroup;

  constructor(
    private readonly router: Router,
    private readonly appStateService: AppStateService,
    private readonly filterService: FilterService
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      searchInput: new UntypedFormControl(),
    });
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
    this.appState$.subscribe((state) => this.theme = state.theme === 'dark' ? true : false);
  }

  navigate(link: string) {
    this.router.navigate([link]);
  }

  changeTheme() {
    this.theme = !this.theme;
    const theme = this.theme ? 'dark' : 'light';
    this.appStateService.patchState({ theme: theme });
  }

  changeLanguage(language: string) {
    this.appStateService.patchState({ lang: language });
  }

  logout() {
    this.appStateService.logoutResetState();
    this.router.navigate(['/auth']);
  }

  submit() {
    if(this.searchForm?.value.searchInput) {
      this.filterService.setTitle(this.searchForm.value.searchInput)
      this.searchForm.controls['searchInput'].reset();
      this.navigate('library/all-entries');
    }
  }
}
