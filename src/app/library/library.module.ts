import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { AdminComponent } from './components/admin/admin.component';
import { NavbarComponent } from '../common/navbar/navbar.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { MaterialModule } from '../material.module';

@NgModule({
  declarations: [HomeComponent, PdfViewerComponent, AdminComponent, NavbarComponent],
  imports:[
    CommonModule,

    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule
  ],
  providers:[]
})
export class LibraryModule { }
