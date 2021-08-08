import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    protected readonly authService: AuthService,
    protected readonly router: Router,
    private readonly appStateService: AppStateService
  ) {}

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

    if (token === null) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return this.authService.verifyToken(token).pipe(
      take(1),
      tap((isValid: boolean) => {
        if (!isValid) {
          this.appStateService.patchState({ token: null });
          this.router.navigate(['/auth/login']);
        }
      })
    );
  }
}
