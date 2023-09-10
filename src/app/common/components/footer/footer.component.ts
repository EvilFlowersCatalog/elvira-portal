import { Component, OnInit } from '@angular/core';
import { NavigationService } from 'src/app/services/general/navigation.service';
import info from '../../../../../package.json';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  public version: string;

  constructor(private readonly navigationService: NavigationService) {}

  ngOnInit(): void {
    this.version = info.version;
  }

  navigate(link: string, event: any) {
    this.navigationService.modifiedNavigation(link, event);
  }

  goToSTU() {
    window.open('https://www.fiit.stuba.sk/', '_blank');
  }
}
