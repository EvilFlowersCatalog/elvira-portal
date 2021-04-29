import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http'
import { AuthService } from './auth.service'
import { Observable } from 'rxjs';
import { baseUrl } from 'src/environments/environment';

@Injectable()
export class TokenInterceptorService implements HttpInterceptor{

  constructor(
    private auth: AuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log("Token interceptor working");
     const authToken = this.auth.getToken();
     const isApiRequest = request.urlWithParams.startsWith(baseUrl)

    const options = {
      headers: authToken && isApiRequest ? request.headers.set('Authorization', `Bearer ${authToken}`) : request.headers,
    };
    const clonedRequest = request.clone(options);
     return next.handle(clonedRequest);
  }
}
