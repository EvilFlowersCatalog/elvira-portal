import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoginCredentials, LoginResponse } from '../types/auth.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiUrl = 'http://localhost:8000';

  constructor(
    private readonly httpClient: HttpClient
  ) { }

  login(loginCredentials: LoginCredentials): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>('api/apigw/auth/login', loginCredentials);
   // return of({ userId: '72076', token: 'token' });
  }

  register(registrationCredentials) {

  }

  verifyToken(token: string): Observable<boolean> {
    return of(true)
  }

  getToken(){
    return localStorage.getItem('token')
  }
}
