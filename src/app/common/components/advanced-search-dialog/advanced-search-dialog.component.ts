import { Component, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { FilterService } from 'src/app/services/general/filter.service';

@Component({
  selector: 'app-advanced-search-dialog',
  templateUrl: './advanced-search-dialog.component.html',
  styleUrls: ['./advanced-search-dialog.component.scss'],
})

export class AdvancedSearchDialogComponent {
  advanced_form: UntypedFormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private readonly filterService: FilterService,
  ) {
    this.advanced_form = new UntypedFormGroup({
      title: new UntypedFormControl(filterService.getTitle()), // set active filter
      author: new UntypedFormControl(filterService.getAuthor()), // set active filter
      created_at: new UntypedFormControl(filterService.getCreatedAt()) // set active filter
    });
  }

  // search, set new data to filter and move to all-entries
  search() {
    console.log(this.advanced_form.value); // for now
  }


}
