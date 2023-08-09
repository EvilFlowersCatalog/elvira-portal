import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeedDetailRespone, ListFeedsResponse } from '../types/library.types';

@Injectable({
  providedIn: 'root',
})
export class FeedsService {
  constructor(
    private readonly httpClient: HttpClient
  ) {}

  getFeeds(
    limit: number,
    title?: string,
    parentId?: string
    ): Observable<ListFeedsResponse> {
      if (title) {
        return this.httpClient.get<ListFeedsResponse>(
          environment.baseUrl + `/api/v1/feeds`,
          {
            params: { page: 1, limit: limit, title: title },
          }
        );
      }
      else if (parentId) {
        return this.httpClient.get<ListFeedsResponse>(
          environment.baseUrl + `/api/v1/feeds`,
          {
            params: { page: 1, limit: limit, parent_id: parentId },
          }
        );
      }
      else {
        return this.httpClient.get<ListFeedsResponse>(
          environment.baseUrl + `/api/v1/feeds`,
          {
            params: { page: 1, limit: limit },
          }
        );
      }
  }

  getFeedDetails(id: string): Observable<FeedDetailRespone> {
    return this.httpClient.get<FeedDetailRespone>(
      environment.baseUrl + `/api/v1/feeds/${id}`
    );
  }
}
