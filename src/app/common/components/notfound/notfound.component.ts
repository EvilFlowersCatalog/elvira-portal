import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.scss']
})
export class NotfoundComponent implements OnInit {

  loginCheck = false;
  show = true;

  constructor(
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    if(localStorage.getItem('token')!=null) this.loginCheck=true;
    console.log(this.loginCheck);
  }

  goToLogin() {
    this.router.navigate(['/auth/login'])
  }


}
