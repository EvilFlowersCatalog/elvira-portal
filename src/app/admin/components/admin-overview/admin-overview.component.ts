import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
})
export class AdminOverviewComponent implements OnInit {
  documentsTabLabel: string;
  feedsTabLabel: string;

  constructor(private translocoService: TranslocoService) {}

  ngOnInit() {
    this.documentsTabLabel = this.translocoService.translate(
      'lazy.adminOverview.documentsTab'
    );
    this.feedsTabLabel = this.translocoService.translate(
      'lazy.adminOverview.feedsTab'
    );
  }
}
