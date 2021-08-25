import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
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
    private readonly notificationService: NotificationService
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
          const googleAuthed = jwtDecode<
            JwtPayload & { googleAuthed: boolean }
          >(response.accessToken).googleAuthed;
          const feedId = jwtDecode<JwtPayload & { feedId: string }>(
            response.accessToken
          ).feedId;
          console.log(response.accessToken);
          this.appStateService.patchState({
            token: response.accessToken,
            username: response.user.login,
            isLoggedIn: true,
            isAdmin: isAdmin,
            feedId: feedId,
            googleAuthed: googleAuthed,
          });
          this.router.navigate(['../../library'], { relativeTo: this.route });
        }),
        take(1),
        catchError((err) => {
          console.log(err);
          const message = 'invalid credentials';
          this.notificationService.error(message);
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
