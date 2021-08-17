import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import {
  addNewFeed,
  AdminResponse,
  AllEntryItems,
  AllFeedsItems,
  EditedData,
  GetEntries,
  GetFeeds,
  UpdateFeeds,
} from './admin.types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  catalog_id = environment.catalogId;

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

  getAllEntries(): Observable<GetEntries> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<GetEntries>(
      'api/apigw/evil-flowers-conn/entries',
      { headers: headers }
    );
  }

  getAllFeeds(): Observable<GetFeeds> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<GetFeeds>('api/apigw/evil-flowers-conn/feeds', {
      headers: headers,
    });
  }

  updateFeed(feedId: string, newFeed: UpdateFeeds) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.put(
      `api/apigw/evil-flowers-conn/admin/feeds/${feedId}`,
      newFeed,
      { headers: headers }
    );
  }

  deleteFeed(feedId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.delete(
      `api/apigw/evil-flowers-conn/admin/feeds/${feedId}`,
      { headers: headers }
    );
  }

  upload(entriesData: FormData) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.post(
      `api/apigw/evil-flowers-conn/admin/catalogs/${this.catalog_id}/entries`,
      entriesData,
      { headers: headers }
    );
  }

  deleteEntry(entryId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.delete(
      `api/apigw/evil-flowers-conn/admin/catalogs/${this.catalog_id}/entries/${entryId}`,
      { headers: headers }
    );
  }

  getOneEntry(entryId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<AllEntryItems>(
      `api/apigw/evil-flowers-conn/catalogs/${this.catalog_id}/entries/${entryId}`,
      { headers: headers }
    );
  }

  updateEntry(entryId: string, entriesData: EditedData) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.put(
      `api/apigw/evil-flowers-conn/admin/catalogs/${this.catalog_id}/entries/${entryId}`,
      entriesData,
      { headers: headers }
    );
  }

  getIsAdmin(mongoId: string) {
    return this.httpClient.get<boolean>(`api/apigw/isAdmin/${mongoId}`);
  }

 checkTitle(title: string){
  const headers = this.createAuthorizationHeader();
  return this.httpClient.get<GetEntries>(
    'api/apigw/evil-flowers-conn/entries',
    { headers: headers, params: {title: title}}
  );
 }


 addNewFeed(feedData: addNewFeed){
  const headers = this.createAuthorizationHeader();
  return this.httpClient.post(
    'api/apigw/evil-flowers-conn/admin/feeds',
    feedData,
    { headers: headers }
  );
 }
}
