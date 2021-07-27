import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Observable} from 'rxjs';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import {map, startWith} from 'rxjs/operators';



export interface Tag {
  name: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  uploadForm: FormGroup;
  counter: number = 0;
  catalogForm = new FormControl();
  options: string[] = ['1. semester', '2. semester', '3. semester', '4. semester'];
  filteredOptions: Observable<string[]>;
  visible: boolean = true;
  selectable: boolean = true;
  removable: boolean = true;
  addOnBlur: boolean = true;
  separatorKeysCodes = [ENTER, COMMA];
  @ViewChild('chipList') chipList;
  feeds = [
    { name: 'Mathematics' },
    { name: 'Programming' },
    { name: 'Artificial intelligence' },
  ];
  file: File;
  isUploading = false;


  contributors(i: number) {
    return new Array(i);
}

  constructor(
      //private readonly store: Store,
  ) {
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
    this.filteredOptions = this.catalogForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }
  //Matchip add
  add(event: MatChipInputEvent): void {
    let input = event.input;
    let value = event.value;

    // Add our feeds
    if ((value || '').trim()) {
      this.feeds.push({ name: value.trim() });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }
  //Matchip remove
  remove(fruit: any): void {
    let index = this.feeds.indexOf(fruit);

    if (index >= 0) {
      this.feeds.splice(index, 1);
    }
  }
  //Autocomplete
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
// TODO: CROP
// imageChangedEvent: any = '';
// croppedImage: any = '';
// fileChangeEvent(event: any): void {
//     this.imageChangedEvent = event;
// }
// imageCropped(event: ImageCroppedEvent) {
//     console.log(event);
//     this.croppedImage = event.base64;
// }
// imageLoaded() {
//     // show cropper
//     console.log('loaded')
// }
// cropperReady() {
//     // cropper ready
//     console.log('ready')
// }
// loadImageFailed() {
//     // show message
//     console.log('failed')
// }
}
