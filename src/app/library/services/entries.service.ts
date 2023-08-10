import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { environment } from '../../../environments/environment';
import { ListEntriesResponse, EntryDetail, AcquisitionDetail, userAcquisitionCreation } from '../types/library.types';
import { FilterService } from './filter.service';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  constructor(
    private readonly httpClient: HttpClient
  ) {}

  getEntries(query: Object) {
    return this.httpClient.get<ListEntriesResponse>(
      environment.baseUrl + '/api/v1/entries',
      query
    );
  }

  entryDetail(catalogID: string, entryID: string): Observable<EntryDetail> {
    return this.httpClient.get<EntryDetail>(
      environment.baseUrl + `/api/v1/catalogs/${catalogID}/entries/${entryID}`
    );
  }

  acquisitionDetail(id: string): Observable<AcquisitionDetail> {
    return this.httpClient.get<AcquisitionDetail>(
      environment.baseUrl + `/api/v1/acquisitions/${id}`
    );
  }

  // NOTE: Not implemented yet in actual version of the API
  addEntryToFavorites(id: string) {
    return this.httpClient.patch(environment.baseUrl + `/apigw/favorite`, {
      entry_id: id,
    });
  }

  // NOTE: Not implemented yet in actual version of the API
  listFavoriteEntries(
    page: number,
    limit: number
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>(
      environment.baseUrl + `/api/v1/favorite`,
      {
        params: { page: page + 1, limit: limit },
      }
    );
  }

  // NOTE: Not implemented yet in actual version of the API
  deleteFromFavorites(id: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/apigw/favorite/${id}`
    );
  }

  createUserAcquisition(userAcquisition: userAcquisitionCreation) {
    return this.httpClient.post(
      environment.baseUrl + `/api/v1/user-acquisitions`,
      userAcquisition
    )
  }

  donwloadUserAcquisition(userAcquisitionId: string, format: string = '') {
    const params = new HttpParams().set('format', format);

    return this.httpClient.get(
      environment.baseUrl + `/data/v1/user-acquisitions/${userAcquisitionId}`,
      { params }
    )
  }
}
