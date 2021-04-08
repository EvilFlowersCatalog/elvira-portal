import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotfoundComponent } from './notfound/notfound.component';
import { NavbarComponent } from './navbar/navbar.component';
import { MaterialModule } from '../material.module';

@NgModule({
  declarations: [NotfoundComponent, NavbarComponent],
  imports: [
    CommonModule,
    MaterialModule
  ]
})
export class CommonLibraryModule { }
