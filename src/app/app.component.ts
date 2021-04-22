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
    this.http.get('http://jsonplaceholder.typicode.com/users')
    .subscribe(data =>{

    });
    this.http.get(baseUrl)
    .subscribe(data =>{

    })
    // this.http.get('http://jsonplaceholder.typicode.com/posts/2')
    // .subscribe(data =>{

    // });

  }
}
