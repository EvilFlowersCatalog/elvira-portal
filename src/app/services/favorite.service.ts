import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppStateService } from './general/app-state.service';
import { Observable } from 'rxjs';
import {
  FavoriteList,
  FavoriteNew,
  FavoritePostResponse,
  FavoriteQuery,
} from '../types/favorite.types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Function for getting list of favorites
   * @returns FavoriteList type, list of favorites for actuall user
   */
  getFavorites(query: FavoriteQuery): Observable<FavoriteList> {
    let params = new HttpParams()
      .set('page', query.page + 1)
      .set('limit', query.limit)
      .set('order_by', '-created_at')
      .set('catalog_id', environment.catalog_id);
    if (query.title) {
      params = params.set('title', query.title);
    }

    return this.httpClient.get<FavoriteList>(
      environment.baseUrl + `/api/v1/shelf-records`,
      { params: params }
    );
  }

  /**
   * Function for adding entry to favorites by given entry id in params
   * @param params FavoriteNew Type, contains entry_id -> string
   * @returns FavoritePostRespose type, shelf-record info + entry detail
   */
  addEntryToFavorites(params: FavoriteNew): Observable<FavoritePostResponse> {
    return this.httpClient.post<FavoritePostResponse>(
      environment.baseUrl + `/api/v1/shelf-records`,
      params
    );
  }

  /**
   * Function for deleting shelf record -> means delete entry from favoritess by given shelf record id
   * @param shelfRecordId string, id of shelf record we want delete
   * @returns answer ? ok/bed
   */
  removeFromFavorites(shelfRecordId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/api/v1/shelf-records/${shelfRecordId}`
    );
  }
}
