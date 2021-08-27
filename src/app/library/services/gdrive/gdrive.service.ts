import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GdriveService {
  catalogId = environment.catalogId;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

  createAuthorizationHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
      api_key: environment.apiKey,
    });
  }

  getAuthUrl(): Observable<any> {
    return this.httpClient.get<any>(`api/apigw/oauth/link`);
  }

  postAuthCode(code: string) {
    return this.httpClient.post(`api/apigw/oauth/callback`, { code: code });
  }

  unlinkGoogle() {
    return this.httpClient.delete('api/apigw/oauth/unlink');
  }

  uploadFileToDrive(entryId: string, catalogId: string) {
    let header = this.createAuthorizationHeader();

    return this.httpClient.post(
      `api/apigw/gdrive/upload`,
      {
        entry_id: entryId,
        catalog_id: catalogId,
      },
      { headers: header }
    );
  }
}
