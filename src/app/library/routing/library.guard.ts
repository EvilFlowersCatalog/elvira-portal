import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class LibraryGuard implements CanActivate {
    constructor(
        protected readonly authService: AuthService,
        protected readonly router: Router,
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        return this.verifyAuthTokenValidity();
    }

    private verifyAuthTokenValidity() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.router.navigate(['/auth/login']);
            return false;
        }

        return this.authService
            .verifyToken(token)
            .pipe(
                take(1),
                tap((isValid: boolean) => {
                    if (!isValid) {
                        localStorage.removeItem('token');
                        this.router.navigate(['/auth/login']);
                    }
                })
            )
    }
}
