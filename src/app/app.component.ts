import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title: string = 'elibrary-portal';
  isDarkTheme: boolean = true;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.isDarkTheme = localStorage.getItem('theme') === "Dark" ? true : false;
  }
}
