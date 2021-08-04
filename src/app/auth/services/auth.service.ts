import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
    this.httpClient.post('api/apigw/auth/logout', token);
  }

  verifyToken(token: string): Observable<boolean> {
    return of(true);
  }
}
