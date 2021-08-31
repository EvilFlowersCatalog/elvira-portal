import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoginCredentials, LoginResponse } from '../types/auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  login(loginCredentials: LoginCredentials): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(
      'api/apigw/auth/login',
      loginCredentials
    );
  }

  logout(token: string) {
    return this.httpClient.post('api/apigw/auth/logout', token);
  }

  verifyToken(): Observable<boolean> {
    // return this.httpClient
    //   .get('api/apigw/verifytoken', { observe: 'response' })
    //   .pipe(
    //     map((response) => {
    //       console.log(response);
    //       return response.status >= 400 ? false : true;
    //     }),
    //     catchError((error: HttpErrorResponse) => {
    //       return of(false);
    //     })
    //   );
    return of(true);
  }
}
