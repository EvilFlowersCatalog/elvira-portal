import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TranslocoService, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ADMIN_ROUTES } from './routing/admin.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminUploadComponent } from './admin-upload/admin-upload.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { MaterialModule } from '../material.module';
import { TabGroupDirective } from './directives/tab-group.directive';
import { MatPaginatorIntl } from '@angular/material/paginator';
import {  getPaginatorIntl } from './custom-pagination/custom-pagination.service';


@NgModule({
  declarations: [AdminOverviewComponent, AdminUploadComponent, TabGroupDirective],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ReactiveFormsModule
  ],
  providers:[
    { provide: TRANSLOCO_SCOPE, useValue: 'lazy' },
    { provide: MatPaginatorIntl ,  useFactory: (TranslocoService: TranslocoService) =>
      getPaginatorIntl(TranslocoService),
    deps: [TranslocoService]}
  ]
})
export class AdminModule { }
