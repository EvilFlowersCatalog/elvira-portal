import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  screen_width: number; // used in html

  constructor() { }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screen_width = window.innerWidth;
  }

  ngOnInit(): void {
    this.screen_width = window.innerWidth;
  }
}
