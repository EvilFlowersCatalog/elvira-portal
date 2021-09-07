import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';

@Injectable({
  providedIn: 'root',
})
export class GdriveService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly appStateService: AppStateService
  ) {}

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
    return this.httpClient.post(`api/apigw/gdrive/upload`, {
      entry_id: entryId,
      catalog_id: catalogId,
    });
  }
}
