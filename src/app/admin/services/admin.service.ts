import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { AdminResponse, AllEntryItems, EditedData, GetEntries } from './admin.types';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService,
    ) {}

    createAuthorizationHeader() {
      return new HttpHeaders({
        authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
        api_key: '1398a10c-f387-4970-bc90-65902c0b4fea'
      });
    }

    createTokenHeader() {
      return new HttpHeaders({
        authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
      });
    }


    getAllEntries(): Observable<GetEntries>{
      const headers = this.createAuthorizationHeader();
      return this.httpClient.get<GetEntries>(
        'api/apigw/evil-flowers-conn/entries',
        {headers: headers}
      );
    }

  upload(entriesData: FormData){
    const headers = this.createAuthorizationHeader();
    return this.httpClient.post(
      'api/apigw/evil-flowers-conn/admin/catalogs/95e2b439-4851-4080-b33e-0adc1fd90196/entries',
      entriesData, {headers: headers}
    );
  }

  deleteEntry(entryId: string) {
    const headers = this.createAuthorizationHeader();
    return this.httpClient.delete(
      `api/apigw/evil-flowers-conn/admin/catalogs/95e2b439-4851-4080-b33e-0adc1fd90196/entries/${entryId}`,
      {headers: headers}
    );
  }

  getOneEntry(entryId: string)
 {
  const headers = this.createAuthorizationHeader();
  return this.httpClient.get<AllEntryItems>(
    `api/apigw/evil-flowers-conn/catalogs/95e2b439-4851-4080-b33e-0adc1fd90196/entries/${entryId}`,
    {headers: headers}
  );
 }

 updateEntry(entryId: string, entriesData: EditedData){
  const headers = this.createAuthorizationHeader();
  return this.httpClient.put(
    `api/apigw/evil-flowers-conn/admin/catalogs/95e2b439-4851-4080-b33e-0adc1fd90196/entries/${entryId}`,
    entriesData, {headers: headers}
  );
 }

 getIsAdmin(mongoId: string){
    const headers = this.createTokenHeader();
    return this.httpClient.get(
      `api/apigw/isAdmin/${mongoId}`,
      {headers: headers}
    );
 }
}
