import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { ListEntriesResponse } from './entries.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  catalogId = environment.catalogId;
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

  listEntries(): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>(
      'api/apigw/evil-flowers-conn/entries',
      {
        headers: header,
      }
    );
  }

  entryDetail(id: string) {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>(
      `api/apigw/evil-flowers-conn/catalogs/${this.catalogId}/entries/${id}`,
      {
        headers: header,
      }
    );
  }
}
