import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { MaterialModule } from '../material.module';
import { AdminComponent } from './components/admin/admin.component';

@NgModule({
  declarations: [HomeComponent, AdminComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule
  ]
})
export class LibraryModule { }
