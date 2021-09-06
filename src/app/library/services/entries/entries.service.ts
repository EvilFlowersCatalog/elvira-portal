import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { EntryDetail, ListEntriesResponse } from './entries.types';

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
    });
  }


  getEntries(page: number, limit: number, query?: string, feedId?: string) {
    let header = this.createAuthorizationHeader();

    if (feedId) {
      return this.httpClient.get<ListEntriesResponse>(
        `api/apigw/feeds/filter/${feedId}`,
        { 
          headers: header,
          params: { page: page + 1, limit: limit },
        },
      );
    }
    else if (query) {
      return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
        headers: header,
        params: { page: page + 1, limit: limit, title: query },
      });
    }
    else {
      return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
        headers: header,
        params: { page: page + 1, limit: limit },
      });
    }
  }

  listEntries(
    page: number,
    limit: number,
    query?: string
  ): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      headers: header,
      params: { page: page + 1, limit: limit, title: query ?? '' },
    });
  }

  getEntriesByFeed(
    page: number,
    limit: number,
    feedId: string
  ): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>(
      `api/apigw/feeds/filter/${feedId}`,
      { 
        headers: header,
        params: { page: page + 1, limit: limit },
      },
    );
  }

  entryDetail(id: string): Observable<EntryDetail> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<EntryDetail>(`api/apigw/entries/${id}`, {
      headers: header,
    });
  }

  addEntryToFavorites(id: string) {
    let header = this.createAuthorizationHeader();

    return this.httpClient.patch(
      `api/apigw/favorite`,
      { entry_id: id },
      {
        headers: header,
      }
    );
  }

  listFavoriteEntries(
    page: number,
    limit: number
  ): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<ListEntriesResponse>(`api/apigw/favorite`, {
      headers: header,
      params: { page: page + 1, limit: limit },
    });
  }

  deleteFromFavorites(id: string) {
    let header = this.createAuthorizationHeader();

    return this.httpClient.delete(`api/apigw/favorite/${id}`, {
      headers: header,
    });
  }
}
