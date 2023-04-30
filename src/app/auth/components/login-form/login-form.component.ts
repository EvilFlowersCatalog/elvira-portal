import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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
  loginForm: FormGroup;
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
            response.response.access_token
          ).isAdmin;
          const googleAuthed = jwtDecode<
            JwtPayload & { googleAuthed: boolean }
          >(response.response.refresh_token).googleAuthed;
          const mongoId = jwtDecode<JwtPayload & { mongoId: string }>(
            response.response.access_token
          ).mongoId;

          this.appStateService.patchState({
            token: response.response.access_token,
            username: 'testUser', // not returned in response
            isLoggedIn: true,
            isAdmin: isAdmin,
            googleAuthed: googleAuthed,
            userId: mongoId,
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
