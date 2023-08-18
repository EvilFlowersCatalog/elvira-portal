import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { AppStateService } from 'src/app/services/general/app-state.service';
import { NotificationService } from 'src/app/services/general/notification.service';
import { UserLogin } from 'src/app/types/user.types';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  login_form: UntypedFormGroup; //used in html
  username: string; // used in html
  password: string; // used in html
  hide_password: boolean = true; // used in html

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly appStateService: AppStateService,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private readonly translocoService: TranslocoService
  ) {
    this.login_form = new UntypedFormGroup({
      username: new UntypedFormControl(''),
      password: new UntypedFormControl(''),
    });
  }

  ngOnInit(): void { }

  submit() {
    // Inputed data
    const loginCredentials = this.login_form.value;

    // Set auth
    this.authService
      .login(loginCredentials)
      .pipe(
        tap((response: UserLogin) => {
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
          // navigate to libarary
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
