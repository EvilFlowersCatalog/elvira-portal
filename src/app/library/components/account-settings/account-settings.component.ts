import { Component, OnInit } from '@angular/core';
import { GdriveService } from '../../services/gdrive/gdrive.service';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { UserService } from '../../services/user/user.service';
import { UserResponse } from '../../library.types';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { Observable, throwError } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { State } from 'src/app/common/services/app-state/app-state.types';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
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
  userData: UserResponse;
  appState$: Observable<State>;

  constructor(
    private readonly gdriveService: GdriveService,
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
    this.userService.getUser().subscribe((data) => (this.userData = data));
  }

  getUrl() {
    this.gdriveService
      .getAuthUrl()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data: { response: { url: string } }) =>
        window.open(data.response.url)
      );
  }

  unlinkGoogle() {
    this.gdriveService
      .unlinkGoogle()
      .pipe(
        takeUntil(this.destroySignal$),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.accountSettings.unlinkSuccessMessage'
          );
          this.notificationService.info(message);
          this.appStateService.patchState({ googleAuthed: false });
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.accountSettings.unlinkErrorMessage'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();
  }

  handleToggle() {
    if (this.appStateService.getStateSnapshot().googleAuthed) {
      this.unlinkGoogle();
    } else {
      this.getUrl();
    }
  }
}
