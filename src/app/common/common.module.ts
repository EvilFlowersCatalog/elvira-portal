import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { DeleteDialogComponent } from './components/delete-dialog/delete-dialog.component';
import { LOCAL_STORAGE_TOKEN } from './services/local-storage/local-storage.service';
import { LibraryModule } from '../library/library.module';
import { LoadingComponent } from './components/loading.component';
import { MobileNavbarComponent } from './components/mobile-navbar/mobile-navbar.component';
import { HeaderComponent } from './components/header/header.component';
import { MobileSidenavComponent } from './components/mobile-sidenav/mobile-sidenav.component';
import { UpdateDialogComponent } from './components/update-dialog/update-dialog.component';
import { FormsModule } from '@angular/forms';
import { NewFeedDialogComponent } from './new-feed-dialog/new-feed-dialog.component';

@NgModule({
  declarations: [
    NavbarComponent,
    NotfoundComponent,
    LoadingComponent,
    MobileNavbarComponent,
    HeaderComponent,
    MobileSidenavComponent,
    DeleteDialogComponent,
    UpdateDialogComponent,
    NewFeedDialogComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    LibraryModule,
    TranslocoRootModule,
    FormsModule,
  ],
  exports: [
    NotfoundComponent,
    LoadingComponent,
    HeaderComponent,
    MobileSidenavComponent,
  ],
  providers: [{ provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }],
})
export class CommonLibraryModule {}
