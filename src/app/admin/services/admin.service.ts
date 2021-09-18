import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { ListEntriesResponse } from 'src/app/library/library.types';
import {
  NewFeed,
  AdminResponse,
  AllEntryItems,
  AllFeedsItems,
  EditedData,
  GetEntries,
  GetFeeds,
  UpdateFeeds,
  OneEntryItem,
} from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  getAllEntries(page: number, limit: number): Observable<GetEntries> {
    return this.httpClient.get<GetEntries>('api/apigw/entries', {
      params: { page: page + 1, limit: limit },
    });
  }

  getAllFeeds(): Observable<GetFeeds> {
    return this.httpClient.get<GetFeeds>('api/apigw/feeds', {
      params: { paginate: 'false' },
    });
  }

  getAllFeedsPagination(page: number, limit: number): Observable<GetFeeds> {
    return this.httpClient.get<GetFeeds>('api/apigw/feeds', {
      params: { page: page + 1, limit: limit },
    });
  }

  updateFeed(feedId: string, newFeed: UpdateFeeds) {
    return this.httpClient.put(`api/apigw/feeds/${feedId}`, newFeed);
  }

  deleteFeed(feedId: string) {
    return this.httpClient.delete(`api/apigw/feeds/${feedId}`);
  }

  upload(entriesData: FormData) {
    return this.httpClient.post(`api/apigw/entries`, entriesData);
  }

  deleteEntry(entryId: string) {
    return this.httpClient.delete(`api/apigw/entries/${entryId}`);
  }

  getOneEntry(entryId: string) {
    return this.httpClient.get<OneEntryItem>(`api/apigw/entries/${entryId}`);
  }

  updateEntry(entryId: string, entriesData: EditedData) {
    return this.httpClient.put(`api/apigw/entries/${entryId}`, entriesData);
  }

  getIsAdmin(mongoId: string) {
    return this.httpClient.get<boolean>(`api/apigw/isAdmin/${mongoId}`);
  }

  checkTitle(title: string) {
    return this.httpClient.get<GetEntries>('api/apigw/entries', {
      params: { title: title },
    });
  }

  addNewFeed(feedData: NewFeed) {
    return this.httpClient.post('api/apigw/feeds', feedData);
  }

  searchEntries(page: number, limit: number, searchInput?: string,) {
    if(searchInput){
      return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: { page: page + 1, limit: limit, title: searchInput },
    });
    } else {
      return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: { page: page + 1, limit: limit },
    });
    }

  }
}
