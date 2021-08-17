import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { EntryDetailComponent } from './components/entry-detail/entry-detail.component';
import { EntryInfoDialogComponent } from './components/entry-info-dialog/entry-info-dialog.component';

@NgModule({
  declarations: [
    HomeComponent,
    PdfViewerComponent,
    SidebarComponent,
    EntryDetailComponent,
    EntryInfoDialogComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule,
    TranslocoRootModule,
    NgxExtendedPdfViewerModule,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'lazy' }],
  exports: [SidebarComponent],
})
export class LibraryModule {}
