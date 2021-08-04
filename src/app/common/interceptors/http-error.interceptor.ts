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
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../services/loading/loading.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackBar: MatSnackBar,
    private readonly loadingService: LoadingService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.loadingService.hideLoading();
        if (error.status >= 500) {
          this.snackBar.open(`Error: ${error.error.message}`, 'close', {
            duration: 5000,
          });
        }
        return throwError(error);
      })
    );
  }
}
