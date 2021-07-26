import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';

@Injectable()
export class TokenInterceptorService implements HttpInterceptor {
  constructor(private readonly appStateService: AppStateService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const authToken = this.appStateService.getStateSnapshot().token;
    const isApiRequest = request.urlWithParams.startsWith(environment.baseUrl);

    const options = {
      headers:
        authToken && isApiRequest
          ? request.headers.set('Authorization', `Bearer ${authToken}`)
          : request.headers,
    };
    const clonedRequest = request.clone(options);
    return next.handle(clonedRequest);
  }
}
