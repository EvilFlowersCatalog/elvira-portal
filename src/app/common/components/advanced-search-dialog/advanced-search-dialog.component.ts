import { Component, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
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
    @Inject(MAT_DIALOG_DATA) public data,
    private readonly router: Router,
  ) {
    this.advanced_form = new UntypedFormGroup({
      title: new UntypedFormControl(''),
      author: new UntypedFormControl(''),
      from: new UntypedFormControl(''),
      to: new UntypedFormControl('')
    });
  }

  // search, set new data to filter and move to library
  search() {
    this.router.navigateByUrl(`elvira/library/${new Filters(this.advanced_form?.value.title ?? '', this.advanced_form?.value.author ?? '').getFilters()}`);
  }
}
