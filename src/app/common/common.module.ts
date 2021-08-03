import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';
import { LOCAL_STORAGE_TOKEN } from './services/local-storage/local-storage.service';
import { LibraryModule } from '../library/library.module';
import { LoadingComponent } from './components/loading.component';

@NgModule({
  declarations: [NavbarComponent, NotfoundComponent, LoadingComponent],
  imports: [CommonModule, MaterialModule, LibraryModule],
  exports: [NavbarComponent, NotfoundComponent, LoadingComponent],
  providers: [{ provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }],
})
export class CommonLibraryModule {}
