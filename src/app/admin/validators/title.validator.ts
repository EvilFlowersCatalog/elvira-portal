import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { map } from 'rxjs/operators';

import { of } from 'rxjs';
import { EntryService } from 'src/app/services/entry.service';

@Injectable({
  providedIn: 'root'
})
export class TitleValidators {
  constructor(
    private http: HttpClient,
    private readonly entryService: EntryService
  ) { }

  searchTitle() {
    // Check if username is available
    return this.entryService.titleCheck().pipe(
      map(
        data => { return data.items; }
      )
    );
  }

  titleValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) { return of(null); }
      return this.searchTitle().pipe(
        map(
          data => {
            if (data.some(item => item.title.toLocaleLowerCase() === control.value.toLocaleLowerCase())) {
              return { 'titleExists': true };
            }
            else return null;
          }
        )
      )
    };
  }

}


