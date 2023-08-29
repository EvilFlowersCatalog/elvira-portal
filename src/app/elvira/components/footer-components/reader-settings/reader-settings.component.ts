import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reader-settings',
  templateUrl: './reader-settings.component.html',
  styleUrls: ['./reader-settings.component.scss']
})
export class ReaderSettingsComponent implements OnInit {

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
