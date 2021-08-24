import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GdriveService } from '../services/gdrive/gdrive.service';

@Component({
  selector: 'app-gdrive-auth',
  template: `<div></div>`,
})
export class GdriveAuthComponent implements OnInit {
  code: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly gdriveService: GdriveService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.code = params['code'];
    });
    this.gdriveService
      .postAuthCode(this.code)
      .subscribe((res) => window.close());
  }
}
