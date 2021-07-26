import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, take } from 'rxjs/operators';
import { LoginResponse } from '../../types/auth.types';
import { throwError } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';
import { AppStateService } from '../../../common/services/app-state/app-state.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  username: string;
  password: string;
  hidePassword: boolean = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private service: TranslocoService,
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

  submit(): void {
    const loginCredentials = this.loginForm.value;
    this.authService
      .login(loginCredentials)
      .pipe(
        take(1),
        catchError((err) => {
          console.log(err);
          this.snackBar.open('Invalid credentials!', 'close', {
            duration: 5000,
          });
          return throwError(err);
        })
      )
      .subscribe((response: LoginResponse) => {
        this.appStateService.patchState({
          token: response.accessToken,
          username: response.user.login,
          isLoggedIn: true,
          // isAdmin: response.user.isAdmin,
        });
        this.router.navigate(['../../library'], { relativeTo: this.route });
      });
  }
}
