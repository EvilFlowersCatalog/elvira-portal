import { Injectable } from '@angular/core';
import {
  CanLoad,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { AdminService } from '../services/admin.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanLoad {
  constructor(
    protected readonly router: Router,
    protected readonly appStateService: AppStateService,
    private readonly adminService: AdminService,
  ) {}

 canLoad(): boolean{
    return this.verifyAdmin();
  }

  verifyAdmin():boolean {
    const token = this.appStateService.getStateSnapshot().token;
    const mongoId = jwtDecode<JwtPayload & { mongoId: string }>(token).mongoId;
    if(this.adminService.getIsAdmin(mongoId).subscribe()) return true;
    else return false;
  }
}
