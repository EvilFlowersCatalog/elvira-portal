import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
} from '../types/auth.types';
import { AppStateService } from 'src/app/common/services/app-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  login(loginCredentials: LoginCredentials): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(
      environment.baseUrl + '/api/v1/token',
      loginCredentials
    );
  }

  logout(token: string) {
    return this.httpClient.post(
      environment.baseUrl + '/apigw/auth/logout',
      token
    );
  }

  verifyToken(): Observable<RefreshTokenResponse> {
    return this.httpClient.post<RefreshTokenResponse>(
      environment.baseUrl + '/api/v1/token/refresh',
      {
        refresh: this.appStateService.getStateSnapshot().refresh_token,
      }
    );
  }
}
