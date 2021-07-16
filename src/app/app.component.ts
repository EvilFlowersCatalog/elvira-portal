import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, Renderer2 } from '@angular/core';
import { LocalStorageService } from './common/services/local-storage.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title: string = 'elibrary-portal';

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private localStorageService: LocalStorageService,
  ) { }

  ngOnInit() {
    this.changeTheme()
  }

  changeTheme() {
    const hostClass = this.localStorageService.getItem('theme') === 'dark' ? 'theme-dark' : 'theme-light'
    this.renderer.setAttribute(this.document.body, 'class', hostClass)
  }
}
