import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { User } from '../types/user.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private readonly httpClient: HttpClient
  ) { }

  /**
   * @param user_id String, id of user wanted user
   * @returns User details
   */
  getUserDetail(user_id: string) {
    return this.httpClient.get<User>(
      environment.baseUrl + `/api/v1/users/${user_id}`
    );
  }
}
