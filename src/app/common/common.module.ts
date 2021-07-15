import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { MaterialModule } from '../material.module';

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
})
export class CommonLibraryModule { }
