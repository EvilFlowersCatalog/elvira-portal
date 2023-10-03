import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeedDetail, FeedNew, FeedQuery, FeedsList } from '../types/feed.types';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * @param query FeedQuery type, specifications of what king od list we want
   * @returns List of feeds
   */
  getFeedsList(query: FeedQuery): Observable<FeedsList> {
    let params = new HttpParams()
      .set('page', query.page + 1)
      .set('limit', query.limit)
      .set('catalog_id', environment.catalog_id);
    if (query.title) {
      params = params.set('title', query.title);
    }
    if (query.parent_id) {
      params = params.set('parent_id', query.parent_id);
    }
    if (query.kind) {
      params = params.set('kind', query.kind);
    }

    return this.httpClient.get<FeedsList>(
      environment.baseUrl + `/api/v1/feeds`,
      { params: params }
    );
  }

  /**
   * @param feed_id -> String, id of feed
   * @returns Detail of feed(with given id)
   */
  getFeedDetail(feed_id: string): Observable<FeedDetail> {
    return this.httpClient.get<FeedDetail>(
      environment.baseUrl + `/api/v1/feeds/${feed_id}`
    );
  }

  /**
   * @param feed FeedNew type, data of created feed
   * @returns Answer
   */
  createFeed(feed: FeedNew) {
    return this.httpClient.post(environment.baseUrl + '/api/v1/feeds', feed);
  }

  /**
   * @param feed_id String, id of feed, that we want change
   * @param feed FeedNew type, updated data of feed
   * @returns Answer
   */
  updateFeed(feed_id: string, feed: FeedNew) {
    return this.httpClient.put(
      environment.baseUrl + `/api/v1/feeds/${feed_id}`,
      feed
    );
  }

  /**
   * @param feed_id String, id of feed, that we want change
   * @returns Answer
   */
  deleteFeed(feed_id: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/api/v1/feeds/${feed_id}`
    );
  }
}
