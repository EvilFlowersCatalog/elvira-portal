import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ADMIN_ROUTES } from './routing/admin.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminUploadComponent } from './admin-upload/admin-upload.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { MaterialModule } from '../material.module';
import { FeedsOverviewComponent } from './feeds-overview/feeds-overview.component';

@NgModule({
  declarations: [AdminOverviewComponent, AdminUploadComponent, FeedsOverviewComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ReactiveFormsModule
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: 'lazy' }]
})
export class AdminModule { }
