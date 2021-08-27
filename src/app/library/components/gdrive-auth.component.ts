import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { throwError } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { GdriveService } from '../services/gdrive/gdrive.service';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Component({
  selector: 'app-gdrive-auth',
  template: `<div></div>`,
})
export class GdriveAuthComponent extends DisposableComponent implements OnInit {
  code: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gdriveService: GdriveService,
    private readonly appStateService: AppStateService,
    private readonly notificationService: NotificationService,
    private readonly translocoService: TranslocoService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.code = params['code'];
    });

    this.gdriveService
      .postAuthCode(this.code)
      .pipe(
        takeUntil(this.destroySignal$),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.accountSettings.authSuccessMessage'
          );
          this.notificationService.success(message);
          this.appStateService.patchState({ googleAuthed: true });
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.accountSettings.authErrorMessage'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();

    this.waitAndClose();
  }

  async waitAndClose() {
    await delay(2000);
    window.close();
  }
}
