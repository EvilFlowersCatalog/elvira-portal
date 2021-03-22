import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class LoginGuard implements CanActivate {
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
            return true;
        }
        this.router.navigate(['/library']);
        return false;
    }
}
