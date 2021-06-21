import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  constructor(
    private readonly router: Router
  ) { }

  ngOnInit(): void {
  }

  goToAdmin() {
    this.router.navigate(['/library/admin'])
  }
  goToHome() {
    this.router.navigate(['/library/home'])
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login'])
  }
}
