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
import { AdminUploadComponent } from './components/admin-upload/admin-upload.component';
import { AdminOverviewComponent } from './components/admin-overview/admin-overview.component';
import { MaterialModule } from '../material.module';
import { TabGroupDirective } from './directives/tab-group.directive';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginationComponent } from '../common/services/custom-pagination/custom-pagination.service';
import { FeedManagementComponent } from './components/feed-management/feed-management.component';
import { DocumentManagementComponent } from './components/document-management/document-management.component';

@NgModule({
  declarations: [
    AdminOverviewComponent,
    AdminUploadComponent,
    TabGroupDirective,
    FeedManagementComponent,
    DocumentManagementComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomPaginationComponent },
    { provide: TRANSLOCO_SCOPE, useValue: 'lazy' },
  ],
})
export class AdminModule {}
