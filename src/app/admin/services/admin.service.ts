import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ListEntriesResponse } from 'src/app/library/types/library.types';
import { environment } from 'src/environments/environment';
import {
  NewFeed,
  EditedData,
  GetEntries,
  UpdateFeeds,
  OneEntryItem,
  AdminResponse,
  EntriesData,
  AcquisitionsItems,
} from '../types/admin.types';
import { BYPASS_LOADING } from 'src/app/common/interceptors/http-request.interceptor';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private readonly httpClient: HttpClient,
  ) {}

  updateFeed(feedId: string, newFeed: UpdateFeeds) {
    return this.httpClient.put(
      environment.baseUrl + `/api/v1/feeds/${feedId}`,
      newFeed
    );
  }

  deleteFeed(feedId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/api/v1/feeds/${feedId}`
    );
  }

  upload(entriesData: EntriesData) {
    return this.httpClient.post(
      environment.baseUrl + `/api/v1/catalogs/1a50a657-7207-4275-8300-c8f1be90e881/entries`,
      entriesData
    );
  }

  async uploadAcquisition(acquisition: FormData, entry_id: string) {
    return this.httpClient.post(
      environment.baseUrl + `/api/v1/catalogs/1a50a657-7207-4275-8300-c8f1be90e881/entries/${entry_id}`,
      acquisition
    )
    .toPromise();
  }

  deleteEntry(entryId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/api/v1/catalogs/1a50a657-7207-4275-8300-c8f1be90e881/entries/${entryId}`
    );
  }

  getOneEntry(entryId: string) {
    return this.httpClient.get<OneEntryItem>(
      environment.baseUrl + `/api/v1/catalogs/1a50a657-7207-4275-8300-c8f1be90e881/entries/${entryId}`
    );
  }

  updateEntry(entryId: string, entriesData: EditedData) {
    return this.httpClient.put(
      environment.baseUrl + `/api/v1/catalogs/1a50a657-7207-4275-8300-c8f1be90e881/entries/${entryId}`,
      entriesData
    );
  }

  getIsAdmin(userId: string) {
    return this.httpClient.get<AdminResponse>(
      environment.baseUrl + `/api/v1/users/${userId}`
    );
  }

  getEntriesForTitleCheck() {
    return this.httpClient.get<GetEntries>(
      environment.baseUrl + '/api/v1/entries',
      {
        context: new HttpContext().set(BYPASS_LOADING, true),
      }
    );
  }

  addNewFeed(feedData: NewFeed) {
    return this.httpClient.post(environment.baseUrl + '/api/v1/feeds', feedData);
  }

  searchEntries(page: number, limit: number, title: string = "") {
    return this.httpClient.get<ListEntriesResponse>(
      environment.baseUrl + '/api/v1/entries',
      {
        params: { page: page + 1, limit: limit, title: title },
      }
    );
  }
}
