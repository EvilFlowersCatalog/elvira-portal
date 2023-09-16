import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { LoadingService } from 'src/app/services/general/loading.service';
import { RequestCounterService } from 'src/app/services/general/request-counter.service';

export const BYPASS_LOADING = new HttpContextToken(() => false);

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(
    private readonly appStateService: AppStateService,
    private readonly loadingService: LoadingService,
    private readonly requestCounterService: RequestCounterService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.context.get(BYPASS_LOADING) === false) {
      this.loadingService.showLoading();
      this.requestCounterService.increment();
    }

    const authToken = this.appStateService.getStateSnapshot().token;
    const options = {
      headers: authToken
        ? request.headers.set('Authorization', `Bearer ${authToken}`)
        : request.headers,
    };

    request = request.clone(options);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.requestCounterService.decrement();
        if (this.requestCounterService.getCount() === 0) {
          this.loadingService.hideLoading();
        }
        return throwError(error);
      }),
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.requestCounterService.decrement();
          if (this.requestCounterService.getCount() === 0) {
            this.loadingService.hideLoading();
          }
        }
      })
    );
  }
}
