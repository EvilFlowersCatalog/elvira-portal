import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { ListEntriesResponse } from './entries.types';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  createAuthorizationHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
      api_key: '7afa8603-7357-4dc8-ada2-fadd148952a1',
    });
  }

  listEntries(): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>(
      'api/apigw/evil-flowers-conn/entries/',
      {
        headers: header,
      }
    );
  }

  entryDetail() {
    console.log('entry detail');
  }
}
