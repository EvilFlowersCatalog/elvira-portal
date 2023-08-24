import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, UrlTree } from '@angular/router';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { UserService } from 'src/app/services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard {
  constructor(
    protected readonly router: Router,
    protected readonly route: ActivatedRoute,
    protected readonly appStateService: AppStateService,
    private readonly userService: UserService,
    private deviceService: DeviceDetectorService
  ) { }

  canLoad():
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    this.verifyAdmin().subscribe((m) => {
      if (m) {
        return of(true);
      } else {
        this.router.navigate(['./'], { relativeTo: this.route });
        return of(false);
      }
    });
    return this.verifyAdmin();
  }

  private verifyAdmin(): Observable<boolean> {
    const token = this.appStateService.getStateSnapshot().token;
    const userId = jwtDecode<JwtPayload & { sub: string }>(token).sub;

    return this.userService.getUserDetail(userId).pipe(map((response) => response.response.is_superuser));
  }
}
