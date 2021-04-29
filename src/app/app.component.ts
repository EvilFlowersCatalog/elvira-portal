import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { baseUrl } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'elibrary-portal';

  constructor(private http: HttpClient){}

  ngOnInit(){

  }
}
