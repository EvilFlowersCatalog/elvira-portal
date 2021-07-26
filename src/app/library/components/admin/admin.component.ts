import { Component, OnInit } from '@angular/core';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { FormGroup, FormControl, FormArray } from '@angular/forms';

export interface Tag {
  name: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: Tag[] = [];
  counter = 0;
  uploadForm: FormGroup;

  contributors(i: number) {
    return new Array(i);
}

  constructor() {
    this.uploadForm = new FormGroup({
      title: new FormControl(''),
      authorName: new FormControl(''),
      authorSurname: new FormControl(''),
      contributorsName: new FormArray([]),
      contributorsSurname: new FormArray([]),
      category: new FormControl(''),
      description: new FormControl(''),
    });
   }

  ngOnInit(): void {
  }

  fileChange(event) {

}

formUploader() {
  console.log(this.uploadForm.value);
}

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.tags.push({name: value});
    }

    //event.chipInput!.clear();
  }

  remove(fruit: Tag): void {
    const index = this.tags.indexOf(fruit);

    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  addContributor() {
    if(this.counter<5)
      this.counter++;
  }

  removeContributor() {
    if(this.counter>0)
      this.counter--;
  }
}
