import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { map } from 'rxjs/operators';
import { AdminService } from '../services/admin.service';

import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleValidators {
  constructor(
    private http: HttpClient,
    private readonly adminService: AdminService,
    ) {}

  searchTitle(text) {
          // Check if username is available
      return this.adminService.checkTitle(text).pipe(
        map(
          data => {return data.items;}
        )
      );
  }

  userValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return this.searchTitle(control.value).pipe(
        map(
          data => data.map(
            resp => {
              if(resp.title.toLocaleLowerCase() === control.value.toLocaleLowerCase()){
                console.log("found");
                return { 'titleExists': true};
              }
              })
        )
        )
    };
  }

}


