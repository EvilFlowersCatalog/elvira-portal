import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { UserResponse } from '../../library.types';

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

    return this.httpClient.get<UserResponse>(`api/apigw/user/${userId}`);
  }
}
