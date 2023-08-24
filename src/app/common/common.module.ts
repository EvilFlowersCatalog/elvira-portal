import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { LoadingComponent } from './components/loading.component';
import { MobileNavbarComponent } from './components/mobile-navbar/mobile-navbar.component';
import { HeaderComponent } from './components/header/header.component';
import { MobileSidenavComponent } from './components/mobile-sidenav/mobile-sidenav.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorNotificationComponent } from './components/notifications/error-notification.component';
import { WarningNotificationComponent } from './components/notifications/warning-notification.component';
import { InfoNotificationComponent } from './components/notifications/info-notification.component';
import { SuccessNotificationComponent } from './components/notifications/success-notification.component';
import { LOCAL_STORAGE_TOKEN } from '../services/general/local-storage.service';
import { AdvancedSearchDialogComponent } from './components/advanced-search-dialog/advanced-search-dialog.component';
import { FooterComponent } from './components/footer/footer.component';
import { ElviraModule } from '../elvira/elvira.module';

@NgModule({
  declarations: [
    NavbarComponent,
    NotfoundComponent,
    LoadingComponent,
    MobileNavbarComponent,
    HeaderComponent,
    FooterComponent,
    MobileSidenavComponent,
    SuccessNotificationComponent,
    ErrorNotificationComponent,
    InfoNotificationComponent,
    WarningNotificationComponent,
    AdvancedSearchDialogComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ElviraModule,
    TranslocoRootModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  exports: [
    NotfoundComponent,
    LoadingComponent,
    HeaderComponent,
    FooterComponent,
    MobileSidenavComponent,
  ],
  providers: [{ provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }],
})
export class CommonElviraModule { }
