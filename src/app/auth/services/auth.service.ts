import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoginCredentials, LoginResponse } from '../types/auth.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = 'http://localhost:8000/api';

  constructor(
    private readonly httpClient: HttpClient
  ) { }

  login(loginCredentials: LoginCredentials): Observable<LoginResponse> {
    // return this.httpClient.post<LoginResponse>(`${this.apiUrl}/login`, loginCredentials);
    return of({ userId: '72076', token: 'token' });
  }

  register(registrationCredentials) {

  }

  verifyToken(token: string): Observable<boolean> {
    return of(token === 'token' ? true : false)
  }
}
