import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../types/auth.types';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
  showLoginForm = false;
  loginForm: FormGroup;
  username: string;
  password: string;
  hidePassword: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly appStateService: AppStateService,
    private readonly route: ActivatedRoute,
    private readonly snackBar: MatSnackBar
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl(''),
      password: new FormControl(''),
    });
  }

  ngOnInit(): void {}

  submit() {
    const loginCredentials = this.loginForm.value;
    this.authService
      .login(loginCredentials)
      .pipe(
        tap((response: LoginResponse) => {
          const isAdmin = jwtDecode<JwtPayload & { isAdmin: boolean }>(
            response.accessToken
          ).isAdmin;
          this.appStateService.patchState({
            token: response.accessToken,
            username: response.user.login,
            isLoggedIn: true,
            isAdmin: isAdmin,
          });
          this.router.navigate(['../../library'], { relativeTo: this.route });
        }),
        take(1),
        catchError((err) => {
          console.log(err);
          this.snackBar.open('Invalid credentials!', 'close', {
            duration: 5000,
          });
          return throwError(err);
        })
      )
      .subscribe();
  }

  loginButtonHandler() {
    if (this.showLoginForm) {
      this.submit();
    } else {
      this.showLoginForm = true;
    }
  }
}
