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
import { FavoritesComponent } from './components/favorites/favorites.component';
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { GdriveAuthComponent } from './components/gdrive-auth.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginationComponent } from '../common/services/custom-pagination.service';

@NgModule({
  declarations: [
    HomeComponent,
    PdfViewerComponent,
    SidebarComponent,
    EntryDetailComponent,
    EntryInfoDialogComponent,
    FavoritesComponent,
    AccountSettingsComponent,
    GdriveAuthComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(LIBRARY_ROUTES),
    MaterialModule,
    TranslocoRootModule,
    NgxExtendedPdfViewerModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'lazy' },
    { provide: MatPaginatorIntl, useClass: CustomPaginationComponent },
  ],
  exports: [SidebarComponent],
})
export class LibraryModule {}
