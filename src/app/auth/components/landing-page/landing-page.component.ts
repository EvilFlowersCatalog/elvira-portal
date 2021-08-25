import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { AuthService } from '../../services/auth.service';
import { LoginFormComponent } from '../login-form/login-form.component';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
})
export class LandingPageComponent implements OnInit {
  showLoginForm = false;
  loginForm: LoginFormComponent;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly appStateService: AppStateService,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private readonly translocoService: TranslocoService
  ) {
    this.loginForm = new LoginFormComponent(
      this.router,
      this.authService,
      this.appStateService,
      this.route,
      this.notificationService,
      this.translocoService
    );
  }

  ngOnInit(): void {}

  loginButtonHandler() {
    if (this.showLoginForm) {
      this.loginForm.submit();
    } else {
      this.showLoginForm = true;
    }
  }
}
