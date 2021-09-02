import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { Authors, FeedTreeNode } from '../../library.types';
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

  entriesSearch(keyword: string): Observable<ListEntriesResponse> {
    let header = this.createAuthorizationHeader();
    let params = new HttpParams().set('title', keyword);

    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: params,
      headers: header,
    });
  }

  getAuthorSuggestions(query: string): Observable<Authors> {
    let header = this.createAuthorizationHeader();
    let params = new HttpParams().set('query', query);

    return this.httpClient.get<Authors>(`api/apigw/authors`, {
      params: params,
      headers: header,
    });
  }

  getFeedTreeNode(): Observable<FeedTreeNode> {
    let header = this.createAuthorizationHeader();

    return this.httpClient.get<FeedTreeNode>(`api/apigw/feed-tree`, {
      headers: header,
    });
  }
}
