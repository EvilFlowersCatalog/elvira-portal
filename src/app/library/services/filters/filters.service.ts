import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BYPASS_LOADING } from 'src/app/common/interceptors/http-request.interceptor';
import {
  Authors,
  FeedTreeNode,
  ListEntriesResponse,
} from '../../library.types';

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  constructor(private readonly httpClient: HttpClient) {}

  entriesSearch(keyword: string): Observable<ListEntriesResponse> {
    let params = new HttpParams().set('title', keyword);

    return this.httpClient.get<ListEntriesResponse>('api/apigw/entries', {
      params: params,
    });
  }

  getAuthorSuggestions(query: string): Observable<Authors> {
    let params = new HttpParams().set('query', query);

    return this.httpClient.get<Authors>(`api/apigw/authors`, {
      params: params,
      context: new HttpContext().set(BYPASS_LOADING, true),
    });
  }

  getFeedTreeNode(): Observable<FeedTreeNode> {
    return this.httpClient.get<FeedTreeNode>(`api/apigw/feed-tree`, {
      context: new HttpContext().set(BYPASS_LOADING, true),
    });
  }
}
