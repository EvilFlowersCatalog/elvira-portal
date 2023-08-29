import { Component, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Filters } from 'src/app/types/general.types';

@Component({
  selector: 'app-advanced-search-dialog',
  templateUrl: './advanced-search-dialog.component.html',
  styleUrls: ['./advanced-search-dialog.component.scss'],
})

export class AdvancedSearchDialogComponent {
  advanced_form: UntypedFormGroup;
  data_source: { title: string, id: string }[] = []; // used in html

  constructor(
    public dialogRef: MatDialogRef<AdvancedSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { filters: Filters },
    private readonly router: Router,
  ) {
    this.advanced_form = new UntypedFormGroup({
      title: new UntypedFormControl(this.data.filters.title),
      author: new UntypedFormControl(this.data.filters.author),
      from: new UntypedFormControl(''),
      to: new UntypedFormControl('')
    });
  }

  // If close return no
  onNoClick(): void {
    this.dialogRef.close('no');
  }

  // if create return values
  onYesClick(): void {
    const { value, valid } = this.advanced_form;
    if (valid) {
      // set value of parents
      this.dialogRef.close(value);
    }
  }
}
