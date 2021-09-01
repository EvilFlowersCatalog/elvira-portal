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

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  createAuthorizationHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
    });
  }

  getAllEntries(page: number, limit: number): Observable<GetEntries> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<GetEntries>(
      'api/apigw/entries',
      { headers: headers, params: {page: page+1, limit: limit}});
  }

  getAllFeeds(): Observable<GetFeeds> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<GetFeeds>('api/apigw/feeds',
    { headers: headers, params: {limit: 100}});
  }

  getAllFeedsPagination(page: number, limit: number): Observable<GetFeeds> {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<GetFeeds>('api/apigw/feeds',
    { headers: headers, params: {page: page+1, limit: limit}});
  }

  updateFeed(feedId: string, newFeed: UpdateFeeds) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.put(
      `api/apigw/feeds/${feedId}`,
      newFeed,
      { headers: headers }
    );
  }

  deleteFeed(feedId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.delete(
      `api/apigw/feeds/${feedId}`,
      { headers: headers }
    );
  }

  upload(entriesData: FormData) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.post(
      `api/apigw/entries`,
      entriesData,
      { headers: headers }
    );
  }

  deleteEntry(entryId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.delete(
      `api/apigw/entries/${entryId}`,
      { headers: headers }
    );
  }

  getOneEntry(entryId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.get<AllEntryItems>(
      `api/apigw/entries/${entryId}`,
      { headers: headers }
    );
  }

  updateEntry(entryId: string, entriesData: EditedData) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.put(
      `api/apigw/entries/${entryId}`,
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
    'api/apigw/entries',
    { headers: headers, params: {title: title}}
  );
 }


 addNewFeed(feedData: addNewFeed){
  const headers = this.createAuthorizationHeader();
  return this.httpClient.post(
    'api/apigw/feeds',
    feedData,
    { headers: headers }
  );
 }
}
