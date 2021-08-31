import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { ListEntriesResponse } from '../entries/entries.types';

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  createAuthorizationHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
    });
  }

  getFeedsTree() {
    // return this.httpClient.get()
  }

  entriesSearch(keyword: string): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();
    let params = new HttpParams().set('title', keyword);
    console.log(params);
    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: params,
      headers: header,
    });
  }
}
