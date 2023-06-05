import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { environment } from '../../../environments/environment';
import { ListEntriesResponse, EntryDetail, AcquisitionDetail } from '../types/library.types';

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  getEntries(
    page: number,
    limit: number,
    query?: string,
    authorId?: string,
    feedId?: string
  ) {
    if (feedId) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + `/apigw/feeds/filter/${feedId}`,
        {
          params: { page: page + 1, limit: limit },
        }
      );
    } else if (authorId && query) {
      console.log();
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/api/v1/entries',
        {
          params: {
            page: page + 1,
            limit: limit,
            title: query,
            author_id: authorId,
          },
        }
      );
    } else if (query) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/api/v1/entries',
        {
          params: { page: page + 1, limit: limit, title: query },
        }
      );
    } else if (authorId) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/api/v1/entries',
        {
          params: { page: page + 1, limit: limit, author_id: authorId },
        }
      );
    } else {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/api/v1/entries',
        {
          params: { page: page + 1, limit: limit },
        }
      );
    }
  }

  getEntriesByFeed(
    page: number,
    limit: number,
    feedId: string
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>(
      environment.baseUrl + `/apigw/feeds/filter/${feedId}`,
      {
        params: { page: page + 1, limit: limit },
      }
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
}
