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
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanLoad {
  constructor(
    protected readonly router: Router,
    protected readonly route: ActivatedRoute,
    protected readonly appStateService: AppStateService,
    private readonly adminService: AdminService,
    private deviceService: DeviceDetectorService
  ) {}

 canLoad():
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    {
      this.verifyAdmin().subscribe(
        m => {
          if(m){
            return of(true);
          }
          else {
            this.router.navigate(['./'], { relativeTo: this.route });
            return of(false);
          }
        }
      )
      return this.verifyAdmin();
  }

  private verifyAdmin(): Observable<boolean> {
    // const isMobile = this.deviceService.isMobile();
    // const isTablet = this.deviceService.isTablet();
    const token = this.appStateService.getStateSnapshot().token;
    const mongoId = jwtDecode<JwtPayload & { mongoId: string }>(token).mongoId;
    // if(isMobile || isTablet){
    //   this.router.navigate(['./'], { relativeTo: this.route });
    //   return of(false);
    // }
    return this.adminService.getIsAdmin(mongoId).pipe(
      map(data => data)
    );
  }
}
