import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { environment } from 'src/environments/environment';
import { UserResponse } from '../../library.types';
import { EntryDetail } from '../entries/entries.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  createAuthorizationHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
      api_key: environment.apiKey,
    });
  }

  getUser(): Observable<UserResponse> {
    let header: HttpHeaders = this.createAuthorizationHeader();
    const userId: string = this.appStateService.getStateSnapshot().userId;

    return this.httpClient.get<UserResponse>(`api/apigw/user/${userId}`, {
      headers: header,
    });
  }
}
