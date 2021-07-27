import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';
import { LOCAL_STORAGE_TOKEN } from './services/local-storage/local-storage.service';

@NgModule({
  declarations: [NavbarComponent, NotfoundComponent],
  imports: [CommonModule, MaterialModule],
  exports: [NavbarComponent, NotfoundComponent],
  providers: [{ provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }],
})
export class CommonLibraryModule {}
