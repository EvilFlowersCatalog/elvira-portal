import { CommonModule } from '@angular/common';
import { InjectionToken, NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';

export const LOCAL_STORAGE_TOKEN = new InjectionToken('localStorage');

@NgModule({
  declarations: [
    NavbarComponent,
    NotfoundComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
  ],
  exports: [
    NavbarComponent,
    NotfoundComponent,
  ],
  providers: [
    { provide: LOCAL_STORAGE_TOKEN, useValue: localStorage }
  ]
})
export class CommonLibraryModule { }
