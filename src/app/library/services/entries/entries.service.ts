import { HttpClient } from '@angular/common/http';
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

  listEntries(page: number, limit: number): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: { page: page + 1, limit: limit },
    });
  }

  searchEntries(
    page: number,
    limit: number,
    query: string
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: { page: page + 1, limit: limit, title: query },
    });
  }

  getEntriesByFeed(
    page: number,
    limit: number,
    feedId: string
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>(
      `api/apigw/feeds/filter/${feedId}`
    );
  }

  entryDetail(id: string): Observable<EntryDetail> {
    return this.httpClient.get<EntryDetail>(`api/apigw/entries/${id}`);
  }

  addEntryToFavorites(id: string) {
    return this.httpClient.patch(`api/apigw/favorite`, { entry_id: id });
  }

  listFavoriteEntries(
    page: number,
    limit: number
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>(`api/apigw/favorite`, {
      params: { page: page + 1, limit: limit },
    });
  }

  deleteFromFavorites(id: string) {
    return this.httpClient.delete(`api/apigw/favorite/${id}`);
  }
}
