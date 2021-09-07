import { HttpClient, HttpParams } from '@angular/common/http';
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
    });
  }

  getFeedTreeNode(): Observable<FeedTreeNode> {
    return this.httpClient.get<FeedTreeNode>(`api/apigw/feed-tree`);
  }
}
