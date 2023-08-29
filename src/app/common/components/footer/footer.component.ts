import { Component } from '@angular/core';
import { NavigationService } from 'src/app/services/general/navigation.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {

  constructor(private readonly navigationService: NavigationService) { }

  navigate(link: string, event: any) {
    this.navigationService.modifiedNavigation(link, event);
  }

  goToSTU() {
    window.open('https://www.fiit.stuba.sk/', '_blank');
  }
}
