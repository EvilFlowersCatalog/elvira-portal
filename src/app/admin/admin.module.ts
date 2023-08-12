import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  TranslocoModule,
  TranslocoService,
  TRANSLOCO_SCOPE,
} from '@ngneat/transloco';
import { ADMIN_ROUTES } from './routing/admin.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentFormComponent } from './components/document-form/document-form.component';
import { AdminOverviewComponent } from './components/admin-overview/admin-overview.component';
import { MaterialModule } from '../material.module';
import { TabGroupDirective } from './directives/tab-group.directive';
import { MatLegacyPaginatorIntl as MatPaginatorIntl } from '@angular/material/legacy-paginator';
import { CustomPaginationComponent } from '../common/services/custom-pagination.service';
import { FeedManagementComponent } from './components/feed-management/feed-management.component';
import { DocumentManagementComponent } from './components/document-management/document-management.component';
import { DeleteDialogComponent } from './components/dialogs/delete-dialog/delete-dialog.component';
import { NewFeedDialogComponent } from './components/dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateFeedDialogComponent } from './components/dialogs/update-feed-dialog/update-feed-dialog.component';
import { AdminEntryDetailComponent } from './components/admin-entry-detail/admin-entry-detail.component';
import { FeedAdminComponent } from './components/admin-feed/admin-feed.component';

@NgModule({
  declarations: [
    AdminOverviewComponent,
    DocumentFormComponent,
    TabGroupDirective,
    FeedManagementComponent,
    DocumentManagementComponent,
    DeleteDialogComponent,
    NewFeedDialogComponent,
    UpdateFeedDialogComponent,
    AdminEntryDetailComponent,
    FeedAdminComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    MaterialModule,
    TranslocoModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginationComponent },
    { provide: TRANSLOCO_SCOPE, useValue: 'lazy' },
  ],
})
export class AdminModule {}
