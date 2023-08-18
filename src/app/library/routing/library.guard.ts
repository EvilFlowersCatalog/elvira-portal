import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, interval } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { UserRefreshToken } from 'src/app/types/user.types';

@Injectable({
  providedIn: 'root',
})
export class LibraryGuard {
  constructor(
    protected readonly authService: AuthService,
    protected readonly router: Router,
    private readonly appStateService: AppStateService
  ) {
    // NOTE: Refreshing the token on app load - if unauthorized, the user will be redirected to the login page, else the token will be updated
    this.authService
      .verifyToken()
      .pipe()
      .subscribe((response?: UserRefreshToken) => {
        this.appStateService.patchState({
          token: response.response.access_token,
        });
      });

    // NOTE: Refreshing the token every 4 minutes (adjust the interval duration as needed)
    interval(4 * 60 * 1000).subscribe(() => {
      this.authService
        .verifyToken()
        .pipe()
        .subscribe((response?: UserRefreshToken) => {
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
