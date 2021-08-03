import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { TranslocoRootModule } from '../../../transloco/transloco-root.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ADMIN_ROUTES } from './routing/admin-page.routes';
import { AdminComponent } from './admin/admin.component';
import { AdminUploadComponent } from './adminUpload/adminUpload.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AdminComponent, AdminUploadComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoRootModule,
  ],
  providers:[{ provide: TRANSLOCO_SCOPE, useValue: 'lazy' }]
})
export class AdminPageModule { }
