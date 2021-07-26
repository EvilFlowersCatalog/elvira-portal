import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { AdminComponent } from './components/admin/admin.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

@NgModule({
  declarations: [HomeComponent, PdfViewerComponent, AdminComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule,
    TranslocoRootModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: 'lazy' }]
})
export class LibraryModule { }
