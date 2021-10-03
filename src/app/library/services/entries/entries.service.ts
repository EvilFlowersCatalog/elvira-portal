import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { environment } from '../../../../environments/environment';
import { ListEntriesResponse, EntryDetail } from '../../library.types';

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
    } else if (query) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/apigw/entries',
        {
          params: { page: page + 1, limit: limit, title: query },
        }
      );
    } else if (authorId) {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/apigw/entries',
        {
          params: { page: page + 1, limit: limit, author_id: authorId },
        }
      );
    } else {
      return this.httpClient.get<ListEntriesResponse>(
        environment.baseUrl + '/apigw/entries',
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

  entryDetail(id: string): Observable<EntryDetail> {
    return this.httpClient.get<EntryDetail>(
      environment.baseUrl + `/apigw/entries/${id}`
    );
  }

  addEntryToFavorites(id: string) {
    return this.httpClient.patch(environment.baseUrl + `/apigw/favorite`, {
      entry_id: id,
    });
  }

  listFavoriteEntries(
    page: number,
    limit: number
  ): Observable<ListEntriesResponse> {
    return this.httpClient.get<ListEntriesResponse>(
      environment.baseUrl + `/apigw/favorite`,
      {
        params: { page: page + 1, limit: limit },
      }
    );
  }

  deleteFromFavorites(id: string) {
    return this.httpClient.delete(
      environment.baseUrl + `/apigw/favorite/${id}`
    );
  }
}
