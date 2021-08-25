import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  verifyToken(token: string): Observable<boolean> {
    // let statusCode;
    // this.httpClient.get('api/apigw/verifytoken', { observe: 'response' }).pipe(
    //   tap((response) => (statusCode = response.status)),
    //   catchError((error: HttpErrorResponse) => (statusCode = error.status))
    // );
    // return statusCode >= 400 ? of(false) : of(true);
    return of(true);
  }
}
