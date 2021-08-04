import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';
import { LOCAL_STORAGE_TOKEN } from './services/local-storage/local-storage.service';
import { LibraryModule } from '../library/library.module';
import { LoadingComponent } from './components/loading.component';
import { MobileNavbarComponent } from './components/mobile-navbar/mobile-navbar/mobile-navbar.component';
import { HeaderComponent } from './components/header/header/header.component';

@NgModule({
  declarations: [
    NavbarComponent,
    NotfoundComponent,
    LoadingComponent,
    MobileNavbarComponent,
    HeaderComponent,
  ],
  imports: [CommonModule, MaterialModule, LibraryModule],
  exports: [NotfoundComponent, LoadingComponent, HeaderComponent],
  providers: [{ provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }],
})
export class CommonLibraryModule {}
