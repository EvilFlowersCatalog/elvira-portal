import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    HomeComponent,
    PdfViewerComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule,
    TranslocoRootModule,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: 'lazy' }],
  exports: [SidebarComponent],
})
export class LibraryModule {}
