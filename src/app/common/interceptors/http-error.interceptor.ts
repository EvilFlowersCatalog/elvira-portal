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
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AppStateService } from '../services/app-state.service';
import { RequestCounterService } from '../services/request-counter.service';

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
        }
        else {
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