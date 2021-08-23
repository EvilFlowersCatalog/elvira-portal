import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GdriveService } from '../../services/gdrive/gdrive.service';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss'],
})
export class AccountSettingsComponent implements OnInit {
  constructor(private readonly gdriveService: GdriveService) {}

  ngOnInit(): void {}

  getUrl() {
    let url: string;

    this.gdriveService
      .getAuthUrl()
      .subscribe((data: { response: { url: string } }) =>
        window.open(data.response.url)
      );
  }
}
