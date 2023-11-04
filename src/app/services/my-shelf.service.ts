import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppStateService } from './general/app-state.service';
import { Observable } from 'rxjs';
import {
  MyShelfList,
  MyShelfNew,
  MyShelfPostResponse,
  MyShelfQuery,
} from '../types/my-shelf.types';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MyShelfService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Function for getting list of MyShelfs
   * @returns MyShelfList type, list of MyShelfs for actuall user
   */
  getMyShelf(query: MyShelfQuery): Observable<MyShelfList> {
    let params = new HttpParams()
      .set('page', query.page + 1)
      .set('limit', query.limit)
      .set('order_by', query.order_by)
      .set('catalog_id', environment.catalog_id);
    if (query.title) {
      params = params.set('title', query.title);
    }

    return this.httpClient.get<MyShelfList>(
      environment.baseUrl + `/api/v1/shelf-records`,
      { params: params }
    );
  }

  /**
   * Function for adding entry to MyShelfs by given entry id in params
   * @param params MyShelfNew Type, contains entry_id -> string
   * @returns MyShelfPostRespose type, shelf-record info + entry detail
   */
  addEntryToMyShelf(params: MyShelfNew): Observable<MyShelfPostResponse> {
    return this.httpClient.post<MyShelfPostResponse>(
      environment.baseUrl + `/api/v1/shelf-records`,
      params
    );
  }

  /**
   * Function for deleting shelf record -> means delete entry from MyShelfss by given shelf record id
   * @param shelfRecordId string, id of shelf record we want delete
   * @returns answer ? ok/bed
   */
  removeFromMyShelf(shelfRecordId: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/api/v1/shelf-records/${shelfRecordId}`
    );
  }
}
