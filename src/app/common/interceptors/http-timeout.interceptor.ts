import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, share, take, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TranslocoService } from '@ngneat/transloco';

@Injectable()
export class HttpTimeoutInterceptor implements HttpInterceptor {
  constructor(private readonly translocoService: TranslocoService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      timeout(environment.httpRequestInterval),
      take(2),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          const timeoutError: HttpErrorResponse = new HttpErrorResponse({
            error: new Error(
              this.translocoService.translate('lazy.timeoutErr')
            ),
            status: 408,
          }) as any;
          return throwError(timeoutError);
        }
      }),
      share()
    );
  }
}
