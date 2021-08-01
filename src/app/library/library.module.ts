import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { AdminComponent } from './components/admin/admin.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { MaterialModule } from '../material.module';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    HomeComponent,
    PdfViewerComponent,
    AdminComponent,
    SidebarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule,
  ],
  providers: [],
  exports: [SidebarComponent],
})
export class LibraryModule {}
