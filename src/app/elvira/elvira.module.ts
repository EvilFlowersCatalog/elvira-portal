import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryComponent } from './components/library/library.component';
import { RouterModule } from '@angular/router';
import { LIBRARY_ROUTES } from './routing/library.routes';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { MaterialModule } from '../material.module';
import { TranslocoRootModule } from '../transloco/transloco-root.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { EntryDetailComponent } from './components/entry-detail/entry-detail.component';
import { EntryInfoDialogComponent } from './components/entry-info-dialog/entry-info-dialog.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyPaginatorIntl as MatPaginatorIntl } from '@angular/material/legacy-paginator';
import { AppWrapperComponent } from './components/wrapper/app-wrapper.component';
import { HomeComponent } from './components/home/home.component';
import { SwipperComponent } from './components/swiper/swiper.component';
import { FeedsPageComponent } from './components/feeds-page/feeds-page.component'
import { FeedComponent } from './components/feed.component'
import { CustomPaginationComponent } from '../services/general/custom-pagination.service';

@NgModule({
  declarations: [
    HomeComponent,
    LibraryComponent,
    PdfViewerComponent,
    EntryDetailComponent,
    EntryInfoDialogComponent,
    FavoritesComponent,
    AppWrapperComponent,
    SwipperComponent,
    FeedsPageComponent,
    FeedComponent,
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
  exports: [],
})
export class ElviraModule { }
