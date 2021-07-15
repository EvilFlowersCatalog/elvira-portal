import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isDarkTheme: boolean = localStorage.getItem('theme') === 'Dark' ? true : false
  isEnglish: boolean = localStorage.getItem('language') === 'English' ? true : false

  constructor(
    private readonly router: Router
  ) { }

  ngOnInit(): void {
  }

  navigate(link: string) {
    this.router.navigate([link])
  }

  setThemeSelection() {
    let switchToTheme: string = this.isDarkTheme ? 'Light' : 'Dark'

    localStorage.setItem('theme', switchToTheme)
    window.location.reload()
  }

  setLanguageSelection() {
    let switchToLanguage: string = this.isEnglish ? 'Slovak' : 'English'

    localStorage.setItem('language', switchToLanguage)
    window.location.reload()
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login'])
  }
}
