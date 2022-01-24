import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { ListEntriesResponse } from 'src/app/library/types/library.types';
import { environment } from 'src/environments/environment';
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
} from '../types/admin.types';
import { BYPASS_LOADING } from 'src/app/common/interceptors/http-request.interceptor';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  getAllEntries(page: number, limit: number): Observable<GetEntries> {
    return this.httpClient.get<GetEntries>(
      environment.baseUrl + '/apigw/entries',
      {
        params: { page: page + 1, limit: limit },
      }
    );
  }

  getAllFeeds(): Observable<GetFeeds> {
    return this.httpClient.get<GetFeeds>(environment.baseUrl + '/apigw/feeds', {
      params: { paginate: 'false' },
    });
  }

  getAllFeedsPagination(page: number, limit: number): Observable<GetFeeds> {
    return this.httpClient.get<GetFeeds>(environment.baseUrl + '/apigw/feeds', {
      params: { page: page + 1, limit: limit },
    });
  }

  updateFeed(feedId: string, newFeed: UpdateFeeds) {
    return this.httpClient.put(
      environment.baseUrl + `/apigw/feeds/${feedId}`,
      newFeed
    );
  }

  deleteFeed(feedId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/apigw/feeds/${feedId}`
    );
  }

  upload(entriesData: FormData) {
    return this.httpClient.post(
      environment.baseUrl + `/apigw/entries`,
      entriesData
    );
  }

  deleteEntry(entryId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/apigw/entries/${entryId}`
    );
  }

  getOneEntry(entryId: string) {
    return this.httpClient.get<OneEntryItem>(
      environment.baseUrl + `/apigw/entries/${entryId}`
    );
  }

  updateEntry(entryId: string, entriesData: EditedData) {
    return this.httpClient.put(
      environment.baseUrl + `/apigw/entries/${entryId}`,
      entriesData
    );
  }

  getIsAdmin(mongoId: string) {
    return this.httpClient.get<boolean>(
      environment.baseUrl + `/apigw/isAdmin/${mongoId}`
    );
  }

  checkTitle(title: string) {
    return this.httpClient.get<GetEntries>(
      environment.baseUrl + '/apigw/entries',
      {
        params: { title: title },
        context: new HttpContext().set(BYPASS_LOADING, true),
      }
    );
  }

  addNewFeed(feedData: NewFeed) {
    return this.httpClient.post(environment.baseUrl + '/apigw/feeds', feedData);
  }

  searchEntries(page: number, limit: number, searchInput?: string) {
    if (searchInput) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/apigw/entries',
        {
          params: { page: page + 1, limit: limit, title: searchInput },
        }
      );
    } else {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/apigw/entries',
        {
          params: { page: page + 1, limit: limit },
        }
      );
    }
  }
}
