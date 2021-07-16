import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from "@angular/router";
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Output()
  readonly themeChanged = new EventEmitter<string>();

  isDarkTheme: boolean
  isEnglish: boolean
  isLoggedIn: boolean
  username: string

  constructor(
    private readonly router: Router,
    private readonly localStorageService: LocalStorageService
  ) { }

  ngOnInit(): void {
    this.isDarkTheme = this.localStorageService.getItem('theme') === 'dark' ? true : false;
    this.isEnglish = this.localStorageService.getItem('language') === 'english' ? true : false;
    this.isLoggedIn = this.localStorageService.getItem('token') === null ? false : true;
    this.username = this.isLoggedIn ? this.localStorageService.getItem('username') : null;
  }

  navigate(link: string) {
    this.router.navigate([link])
  }

  onThemeChange(theme: string) {
    this.localStorageService.setItem('theme', theme)
    this.isDarkTheme = !this.isDarkTheme
    this.themeChanged.emit()
  }

  setLanguageSelection() {
    let switchToLanguage: string = this.isEnglish ? 'slovak' : 'english'

    this.localStorageService.setItem('language', switchToLanguage)
    window.location.reload()
  }

  logout() {
    this.localStorageService.removeItem('token');
    this.localStorageService.removeItem('username');
    this.router.navigate(['/auth/login'])
  }
}
