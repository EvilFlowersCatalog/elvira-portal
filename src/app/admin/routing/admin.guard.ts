import { Injectable } from '@angular/core';
import {
  CanLoad,
  Router,
  ActivatedRoute,
  UrlTree,
} from '@angular/router';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { AdminService } from '../services/admin.service';
import { take, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanLoad {
  constructor(
    protected readonly router: Router,
    protected readonly appStateService: AppStateService,
    private readonly adminService: AdminService,
    private readonly route: ActivatedRoute
  ) {}

 canLoad():
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    {
       return this.verifyAdmin();
  }

  private verifyAdmin(): Observable<boolean> {
    const token = this.appStateService.getStateSnapshot().token;
    const mongoId = jwtDecode<JwtPayload & { mongoId: string }>(token).mongoId;
    return this.adminService.getIsAdmin(mongoId).pipe(
      map(data => data)
    );
  }
}
