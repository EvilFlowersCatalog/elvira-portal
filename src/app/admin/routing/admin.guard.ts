import { Injectable } from '@angular/core';
import { CanLoad, Route, Router } from '@angular/router';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanLoad {
  constructor(
    protected readonly router: Router,
    protected readonly appStateService: AppStateService,
    private readonly httpClient: HttpClient
  ) {}

  createTokenHeader() {
    return new HttpHeaders({
      authorization: `bearer ${this.appStateService.getStateSnapshot().token}`,
    });
  }

  canLoad(): boolean{
    const headers = this.createTokenHeader();
    const token = this.appStateService.getStateSnapshot().token;
    const mongoId = jwtDecode<JwtPayload & { mongoId: string }>(token).mongoId;
    this.httpClient.get(
      `api/apigw/isAdmin/${mongoId}`,
      {headers: headers}
    ).subscribe(isAdmin => {
      if(isAdmin) return true;
      else return false;
    })
    return false;
  }


}
