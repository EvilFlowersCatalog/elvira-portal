import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GdriveService {
  constructor(private readonly httpClient: HttpClient) {}

  getAuthUrl(): Observable<any> {
    return this.httpClient.get<any>(`/conn/gdrive-upload`);
  }

  postAuthCode(code: string) {
    return this.httpClient.post(`/conn/gdrive-upload/callback`, {
      params: new HttpParams().set('code', code),
    });
  }
}
