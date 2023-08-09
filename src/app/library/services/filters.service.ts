// import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { BYPASS_LOADING } from 'src/app/common/interceptors/http-request.interceptor';
// import { environment } from 'src/environments/environment';
// import {
//   Authors,
//   FeedTreeNode,
//   ListEntriesResponse,
// } from '../types/library.types';

// @Injectable({
//   providedIn: 'root',
// })
// export class FiltersService {
//   constructor(private readonly httpClient: HttpClient) {}

//   entriesSearch(keyword: string): Observable<ListEntriesResponse> {
//     let params = new HttpParams().set('title', keyword);

//     return this.httpClient.get<ListEntriesResponse>(
//       environment.baseUrl + '/apigw/entries',
//       {
//         params: params,
//       }
//     );
//   }

//   getAuthorSuggestions(query: string): Observable<Authors> {
//     let params = new HttpParams().set('query', query);

//     return this.httpClient.get<Authors>(
//       environment.baseUrl + `/apigw/authors`,
//       {
//         params: params,
//         context: new HttpContext().set(BYPASS_LOADING, true),
//       }
//     );
//   }
// }
