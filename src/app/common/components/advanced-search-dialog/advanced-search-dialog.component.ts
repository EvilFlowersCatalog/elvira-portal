import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
} from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Filters } from 'src/app/types/general.types';

@Component({
  selector: 'app-advanced-search-dialog',
  templateUrl: './advanced-search-dialog.component.html',
  styleUrls: ['./advanced-search-dialog.component.scss'],
})
export class AdvancedSearchDialogComponent {
  advanced_form: UntypedFormGroup;
  selectedMonth: string;

  constructor(
    public dialogRef: MatDialogRef<AdvancedSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { filters: Filters },
    private readonly router: Router
  ) {
    this.advanced_form = new UntypedFormGroup({
      title: new UntypedFormControl(''),
      author: new UntypedFormControl(''),
      fromYear: new UntypedFormControl('', {
        asyncValidators: [this.yearValidation('from')],
        updateOn: 'blur',
      }),
      fromMonth: new UntypedFormControl(
        { value: '', disabled: true },
        {
          asyncValidators: [this.monthValidation('from')],
          updateOn: 'blur',
        }
      ),
      fromDay: new UntypedFormControl(
        { value: '', disabled: true },
        {
          asyncValidators: [this.dayValidation()],
          updateOn: 'blur',
        }
      ),
      toYear: new UntypedFormControl('', {
        asyncValidators: [this.yearValidation('to')],
        updateOn: 'blur',
      }),
      toMonth: new UntypedFormControl(
        { value: '', disabled: true },
        {
          asyncValidators: [this.monthValidation('to')],
          updateOn: 'blur',
        }
      ),
      toDay: new UntypedFormControl(
        { value: '', disabled: true },
        {
          asyncValidators: [this.dayValidation()],
          updateOn: 'blur',
        }
      ),
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

  yearValidation(type: string) {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;
      type === 'from'
        ? (this.advanced_form?.get('fromMonth')?.disable(),
          this.advanced_form?.get('fromMonth')?.reset(),
          this.advanced_form?.get('fromDay')?.reset())
        : (this.advanced_form?.get('toMonth')?.disable(),
          this.advanced_form?.get('toMonth')?.reset(),
          this.advanced_form?.get('toDay')?.reset());
      if (!value) {
        return of(null); // Return null for empty value
      }
      if (isNaN(value)) {
        return of({ invalidYear: true }); // Return an error object for invalid value
      }
      const intValue = parseInt(value);
      if (intValue < 1500) {
        return of({ invalidYear: true }); // Return an error object for invalid value
      } else {
        type === 'from'
          ? this.advanced_form.get('fromMonth').enable()
          : this.advanced_form.get('toMonth').enable();
        return of(null); // Return null for valid value
      }
    };
  }

  monthValidation(type: string) {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;
      type === 'from'
        ? (this.advanced_form?.get('fromDay')?.disable(),
          this.advanced_form?.get('fromDay')?.reset())
        : (this.advanced_form?.get('toDay')?.disable(),
          this.advanced_form?.get('toDay')?.reset());
      if (!value) {
        return of(null); // Return null for empty value
      }
      const monthReg = /^0[1-9]$|^1[0-2]$/;

      if (!monthReg.test(value)) {
        return of({ invalidMonth: true }); // Return an error object for invalid value
      } else {
        this.selectedMonth = value;
        type === 'from'
          ? this.advanced_form.get('fromDay').enable()
          : this.advanced_form.get('toDay').enable();
        return of(null); // Return null for valid value
      }
    };
  }

  dayValidation() {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = control.value;
      if (!value) {
        return of(null); // Return null for empty value
      }

      const smallMonthReg = /^0[1-9]$|^1[0-9]$|^2[0-9]$/;
      const middleMonthReg = /^0[1-9]$|^1[0-9]$|^2[0-9]$|^30$/;
      const bigMonthReg = /^0[1-9]$|^1[0-9]$|^2[0-9]$|^3[0-1]$/;

      if (this.selectedMonth === '02') {
        if (smallMonthReg.test(value)) {
          return of(null); // Return null for valid value
        } else {
          return of({ invalidMonth: true }); // Return an error object for invalid value
        }
      } else if (
        this.selectedMonth === '01' ||
        this.selectedMonth === '03' ||
        this.selectedMonth === '05' ||
        this.selectedMonth === '07' ||
        this.selectedMonth === '08' ||
        this.selectedMonth === '10' ||
        this.selectedMonth === '12'
      ) {
        if (bigMonthReg.test(value))
          return of(null); // Return null for valid value
        else {
          return of({ invalidMonth: true }); // Return an error object for invalid value
        }
      } else {
        if (middleMonthReg.test(value))
          return of(null); // Return null for valid value
        else {
          return of({ invalidMonth: true }); // Return an error object for invalid value
        }
      }
    };
  }
}
