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
    query?: any
    ): Observable<ListFeedsResponse> {
      return this.httpClient.get<ListFeedsResponse>(
        environment.baseUrl + `/api/v1/feeds`,
        {
          params: query
        }
      );
  }

  getFeedDetails(id: string): Observable<FeedDetailRespone> {
    return this.httpClient.get<FeedDetailRespone>(
      environment.baseUrl + `/api/v1/feeds/${id}`
    );
  }
}
