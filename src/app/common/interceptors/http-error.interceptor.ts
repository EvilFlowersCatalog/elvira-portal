import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { NotificationService } from 'src/app/services/general/notification.service';
import { LoadingService } from 'src/app/services/general/loading.service';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { RequestCounterService } from 'src/app/services/general/request-counter.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly loadingService: LoadingService,
    private readonly router: Router,
    private readonly translocoService: TranslocoService,
    private readonly appStateService: AppStateService,
    private readonly requestCounterService: RequestCounterService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.requestCounterService.decrement();
        this.loadingService.hideLoading();

        if (error.status >= 500) {
          this.notificationService.error(`Error: ${error.error.message}`);
        } else if (error.status >= 400 && error.status !== 401) {
          this.notificationService.error(
            `Error: ${this.translocoService.translate(
              'lazy.somethingWentWrong'
            )}`
          );
        } else {
          this.notificationService.info(
            this.translocoService.translate('lazy.auth.autoLogout')
          );
          this.appStateService.logoutResetState();
          this.router.navigate(['/auth']);
        }
        return throwError(error);
      })
    );
  }
}
