import { Component, OnInit } from '@angular/core';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { UserResponse } from '../../types/library.types';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { Observable, throwError } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { State } from 'src/app/common/types/app-state.types';
import { NotificationService } from 'src/app/common/services/notification.service';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
})
export class AccountSettingsComponent
  extends DisposableComponent
  implements OnInit
{
  userData: UserResponse['response'];
  appState$: Observable<State>;

  constructor(
    private readonly userService: UserService,
    private readonly appStateService: AppStateService,
    private readonly notificationService: NotificationService,
    private readonly translocoService: TranslocoService
  ) {
    super();
  }

  ngOnInit(): void {
    this.appState$ = this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$));
    this.userService.getUser().subscribe((data) => (this.userData = data.response));
  }
}
