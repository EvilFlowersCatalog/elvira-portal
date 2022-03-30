import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppStateService } from '../services/app-state.service';
import { LoadingService } from '../services/loading.service';
import { environment } from 'src/environments/environment';

export const BYPASS_LOADING = new HttpContextToken(() => false);

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(
    private readonly appStateService: AppStateService,
    private readonly loadingService: LoadingService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (request.context.get(BYPASS_LOADING) === false) {
      this.loadingService.showLoading();
    }
    const authToken = this.appStateService.getStateSnapshot().token;
    // const isApiRequest = request.urlWithParams.startsWith(environment.baseUrl);
    const options = {
      headers: authToken
        ? request.headers.set('Authorization', `Bearer ${authToken}`)
        : request.headers,
    };

    request = request.clone(options);
    return next.handle(request);
  }
}
