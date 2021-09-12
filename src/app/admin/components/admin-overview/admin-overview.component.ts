import { Component, OnInit } from '@angular/core';
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
  providers: [ChangeListenerService],
})
export class AdminOverviewComponent
  implements OnInit
{
  constructor() {
  }

  //Pass info to pagination
  ngOnInit() {
  }
}
