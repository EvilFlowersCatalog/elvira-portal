import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Observable} from 'rxjs';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './adminUpload.component.html',
  styleUrls: ['./adminUpload.component.scss'],
})
export class AdminUploadComponent implements OnInit {
  uploadForm: FormGroup;
  counter: number = 0;
  //Chips variables
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  feedCtrl = new FormControl();
  filteredFeeds: Observable<string[]>;
  feeds: string[] = ['FIIT'];
  allFeeds: string[] = ['Mathematics', 'Artificial intelligence', 'Programming', '1. Semester'];
  //Image upload variables
  file: File;
  isUploading = false;
  validSize: boolean = false;

  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;

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
    this.filteredFeeds = this.feedCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => fruit ? this._filter(fruit) : this.allFeeds.slice()));
  }

  //Add feeds chips function
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our feed
    if (value) {
      this.feeds.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.feedCtrl.setValue(null);
  }
  //Remove feeds chips function
  remove(feed: string): void {
    const index = this.feeds.indexOf(feed);

    if (index >= 0) {
      this.feeds.splice(index, 1);
    }
  }
  //Add selected chips from autocomplete
  selected(event: MatAutocompleteSelectedEvent): void {
    this.feeds.push(event.option.viewValue);
    this.fruitInput.nativeElement.value = '';
    this.feedCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allFeeds.filter(fruit => fruit.toLowerCase().includes(filterValue));
  }

  //pdf file uploader
  fileChange(event) {

  }

  //submit button -> POST
  formUploader() {
    const uploadCredentials = this.uploadForm.value;
    console.log(uploadCredentials);
  }

  //ngFor add contributor
  addContributor() {
    if(this.counter<5)
      this.counter++;
  }

//ngFor remove contributor
  removeContributor() {
    if(this.counter>0)
      this.counter--;
  }

  //image uploader
  submit() {
    if (!this.file || this.isUploading) {
        return;
    }
    this.isUploading = true;
    const formData = new FormData();
    formData.append('logo', this.file, this.file.name);
}
// close() {
//     this.dialogRef.close({ confirmed: false });
// }
onFileDropped(file: File) {
    this.file = file;
}
fileSelectedFromBrowse(file: File) {
    this.file = file;
}
removeFile() {
    this.file = null;
}
formatFileSize(bytes: number, decimals = 0) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    console.log(this.validSize);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

checkImageSize(bytes: number, decimals = 0) {
  const k = 1024;
  const dm = decimals <= 0 ? 0 : decimals || 2;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const info = (bytes / Math.pow(k, i)).toFixed(dm);
  if(sizes[i] === 'Bytes' || sizes[i] === 'KB'){
    this.validSize = true;
    return true;
  }
  if(sizes[i] === 'MB' && (info === '4' || info === '3' || info === '2' || info === '1')){
    this.validSize = true;
    return true;
  }
  else this.validSize = false;
  if(sizes[i] === 'GB' || sizes[i] === 'TB' || sizes[i] === 'PB' || sizes[i] === 'EB' || sizes[i] === 'ZB' || sizes[i] === 'YB')
  //console.log(size);
  //console.log(imageSize);
  this.validSize = false;
  return false;
}
}
