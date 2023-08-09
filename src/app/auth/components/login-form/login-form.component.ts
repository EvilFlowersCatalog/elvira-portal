import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state.service';
import { NotificationService } from 'src/app/common/services/notification.service';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../types/auth.types';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  loginForm: UntypedFormGroup;
  username: string;
  password: string;
  hidePassword: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly appStateService: AppStateService,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private readonly translocoService: TranslocoService
  ) {
    this.loginForm = new UntypedFormGroup({
      username: new UntypedFormControl(''),
      password: new UntypedFormControl(''),
    });
  }

  ngOnInit(): void {}

  submit() {
    const loginCredentials = this.loginForm.value;
    this.authService
      .login(loginCredentials)
      .pipe(
        tap((response: LoginResponse) => {
          this.appStateService.patchState({
            token: response.response.access_token,
            refresh_token: response.response.refresh_token,
            username: response.response.user.username,
            name: response.response.user.name,
            surname: response.response.user.surname,
            isLoggedIn: true,
            isAdmin: response.response.user.is_superuser,
            userId: response.response.user.id,
          });
          this.router.navigate(['../../library'], { relativeTo: this.route });
        }),
        take(1),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'loginForm.invalidCredentials'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe();
  }
}
