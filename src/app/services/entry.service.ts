import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EntriesList,
  EntryNew,
  EntryDetail,
  EntryQuery,
  EntryInfo,
} from '../types/entry.types';
import { BYPASS_LOADING } from '../common/interceptors/http-request.interceptor';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * @param query EntryQuery type, spceification for what entries we want
   * @returns List of entries
   */
  getEntriesList(query: EntryQuery) {
    let params = new HttpParams()
      .set('page', query.page + 1)
      .set('limit', query.limit)
      .set('catalog_id', environment.catalog_id);
    if (query.title) {
      params = params.set('title', query.title);
    }
    if (query.feed_id) {
      params = params.set('feed_id', query.feed_id);
    }
    if (query.order_by) {
      params = params.set('order_by', query.order_by);
    }
    if (query.published_at_gte) {
      params = params.set('published_at_gte', query.published_at_gte);
    }
    if (query.published_at_lte) {
      params = params.set('published_at_lte', query.published_at_lte);
    }
    if (query.author) {
      params = params.set('author', query.author);
    }

    return this.httpClient.get<EntriesList>(
      environment.baseUrl + '/api/v1/entries',
      { params: params }
    );
  }

  /**
   * @param entry_id String, if of entry
   * @returns Details of wanted entry
   */
  getEntryDetail(entry_id: string): Observable<EntryDetail> {
    return this.httpClient.get<EntryDetail>(
      environment.baseUrl +
        `/api/v1/catalogs/${environment.catalog_id}/entries/${entry_id}`
    );
  }

  /**
   * @param entry EntryNew type, data of new entry
   * @returns Answer
   */
  createEntry(entry: EntryNew) {
    return this.httpClient.post(
      environment.baseUrl +
        `/api/v1/catalogs/${environment.catalog_id}/entries`,
      entry
    );
  }

  /**
   * @param entry_id String, id of entry we want change
   * @param entry EntryNew type, updated data of entry
   * @returns Answer
   */
  updateEntry(entry_id: string, entry: EntryNew) {
    return this.httpClient.put(
      environment.baseUrl +
        `/api/v1/catalogs/${environment.catalog_id}/entries/${entry_id}`,
      entry
    );
  }

  /**
   * @param entry_id String, id of entry we want delete
   * @returns Answer
   */
  deleteEntry(entry_id: string) {
    return this.httpClient.delete(
      environment.baseUrl +
        `/api/v1/catalogs/${environment.catalog_id}/entries/${entry_id}`
    );
  }

  /**
   * @param acquisition FormData, data of acquisition, file, etc..
   * @param entry_id String, Id of entry
   * @returns Answer
   */
  async uploadEntryAcquisition(acquisition: FormData, entry_id: string) {
    return this.httpClient
      .post(
        environment.baseUrl +
          `/api/v1/catalogs/${environment.catalog_id}/entries/${entry_id}`,
        acquisition
      )
      .toPromise();
  }

  /**
   * Funtion for checking, if user put title that was already used
   * @returns List of entries
   */
  titleCheck() {
    return this.httpClient.get<EntriesList>(
      environment.baseUrl + '/api/v1/entries',
      {
        context: new HttpContext().set(BYPASS_LOADING, true),
      }
    );
  }

  getEntryInfo(driver: string, identifier: string): Observable<EntryInfo> {
    const params = {
      driver: driver,
      identifier: encodeURIComponent(identifier),
    };
    return this.httpClient.get<EntryInfo>(
      environment.baseUrl + `/api/v1/entry-introspection`,
      { params: params }
    );
  }
}
