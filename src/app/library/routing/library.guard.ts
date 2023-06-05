import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, interval } from 'rxjs';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { AuthService } from '../../auth/services/auth.service';
import { RefreshTokenResponse } from 'src/app/auth/types/auth.types';

@Injectable({
  providedIn: 'root',
})
export class LibraryGuard implements CanActivate {
  constructor(
    protected readonly authService: AuthService,
    protected readonly router: Router,
    private readonly appStateService: AppStateService
  ) {
    // NOTE: Refreshing the token on app load - if unauthorized, the user will be redirected to the login page, else the token will be updated
    this.authService
      .verifyToken()
      .pipe()
      .subscribe((response?: RefreshTokenResponse) => {
        this.appStateService.patchState({
          token: response.response.access_token,
        });
      });

    // NOTE: Refreshing the token every 10 minutes (adjust the interval duration as needed)
    interval(10 * 60 * 1000).subscribe(() => {
      this.authService
        .verifyToken()
        .pipe()
        .subscribe((response?: RefreshTokenResponse) => {
          this.appStateService.patchState({
            token: response.response.access_token,
          });
        });
    });
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return this.verifyAuthTokenValidity();
  }

  private verifyAuthTokenValidity() {
    const token = this.appStateService.getStateSnapshot().token;

    if (!token) {
      this.appStateService.logoutResetState();
      this.router.navigate(['/auth']);
      return false;
    }

    return true;
  }
}
