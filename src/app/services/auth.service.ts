import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  User,
  UserCredentials,
  UserLogin,
  UserRefreshToken,
} from '../types/user.types';
import { AppStateService } from './general/app-state.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  /**
   * @param user_credentials UserCredentials type, username and password
   * @returns User info and token
   */
  login(user_credentials: UserCredentials): Observable<UserLogin> {
    return this.httpClient.post<UserLogin>(
      environment.baseUrl + '/api/v1/token',
      user_credentials
    );
  }

  /**
   * @returns Refresh token
   */
  verifyToken(): Observable<UserRefreshToken> {
    return this.httpClient.post<UserRefreshToken>(
      environment.baseUrl + '/api/v1/token/refresh',
      {
        refresh: this.appStateService.getStateSnapshot().refresh_token,
      }
    );
  }
}
