import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, take } from 'rxjs/operators';
import { LoginResponse } from '../../types/auth.types';
import { throwError } from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  username: string;
  password: string;
  hidePassword = true;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private snackBar: MatSnackBar,
    private service: TranslocoService
  ) {
    this.loginForm = new FormGroup({
      username: new FormControl(''),
      password: new FormControl(''),
    });
  }

  ngOnInit(): void {

  }

  submit(): void {
    const loginCredentials = this.loginForm.value;
    this.authService.login(loginCredentials)
      .pipe(
        take(1),
        catchError(err => {
          console.log(err);
          this.snackBar.open('Invalid credentials!', 'close', {
            duration: 5000,
          });
          return throwError(err)
        })
      )
      .subscribe((response: LoginResponse) => {
        //console.log(response);
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('username', response.user.login);
        this.router.navigate(['/library'])
      });
  }

  change(lang: string) {
    this.service.setActiveLang(lang);
  }

}
