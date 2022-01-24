import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { environment } from 'src/environments/environment';
import { UserResponse } from '../types/library.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  getUser(): Observable<UserResponse> {
    const userId: string = this.appStateService.getStateSnapshot().userId;

    return this.httpClient.get<UserResponse>(
      environment.baseUrl + `/apigw/user/${userId}`
    );
  }
}
