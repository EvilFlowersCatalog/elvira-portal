import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Observable} from 'rxjs';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import {map, startWith} from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { HttpClient } from '@angular/common/http';
import { AllEntryItems, EditedData, EntriesData } from '../services/admin.types';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-upload.component.html',
  styleUrls: ['./admin-upload.component.scss'],
})
export class AdminUploadComponent implements OnInit {
  uploadForm: FormGroup;
  editForm: FormGroup;
  imageForm: FormGroup;
  contributors: FormArray;
  counter: number = 4;
  //Chips variables
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  feedCtrl = new FormControl();
  filteredFeeds: Observable<string[]>;
  feeds: string[] = ['FIIT'];
  allFeeds: string[] = ['Mathematics', 'Artificial intelligence', 'Programming', '1. Semester'];
  //Image upload variables
  imageFile: File;
  pdfFile: File;
  isUploading = false;
  validSize: boolean = false;

  entryId: string;
  isInEditMode: boolean = false;
  editData: AllEntryItems;

  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;



  constructor(
    private formBuilder: FormBuilder,
    private readonly adminService: AdminService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    ) {

      this.imageForm = new FormGroup({
        file: new FormControl(null)
      });

    this.uploadForm = new FormGroup({
      title: new FormControl('', Validators.required),
      author: new FormGroup({
        name: new FormControl('', Validators.required),
        surname: new FormControl('', Validators.required)
      }),
      contributors: new FormArray([]),
      summary: new FormControl('', Validators.required),
      language_code: new FormControl('sk')
    });

    this.editForm = new FormGroup({
      title: new FormControl('', Validators.required),
      author: new FormGroup({
       name: new FormControl('', Validators.required),
       surname: new FormControl('', Validators.required)
     }),
     summary: new FormControl('', Validators.required)
    });
   }



   createItem(): FormGroup {
    return this.formBuilder.group({
      name: '',
      surname: ''
    });
  }

  addContributor(): void {
    this.contributors = this.uploadForm.get('contributors') as FormArray;
    this.contributors.push(this.createItem());
  }

  deleteContributor(index: number) {
    const add = this.uploadForm.get('contributors') as FormArray;
    add.removeAt(index)
  }

  ngOnInit(): void {
    this.entryId = this.route.snapshot.paramMap.get('id');
      //console.log(this.entryId);
      if(this.entryId != null && !this.isInEditMode){
        this.adminService.getOneEntry(this.entryId).subscribe(
          datas => {
            this.editData = datas;
            console.log(datas);
          }
        );
        this.isInEditMode = true;
      }

    this.filteredFeeds = this.feedCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => fruit ? this._filter(fruit) : this.allFeeds.slice()));

      //console.log(this.isInEditMode);
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
  async formUploader() {

    if(this.isInEditMode){
      this.adminService.updateEntry(this.entryId, this.getEditedData()).subscribe();
    }
    else {
    let testData: FormData = new FormData();
    testData.append('file', this.imageFile, this.imageFile.name);
    testData.append('body', JSON.stringify(await this.getFormData()));
    // console.log(testData.get('body'));
    // console.log(testData.get('file'));

    this.adminService.upload(testData).subscribe(datas => console.log(datas));
    }
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getEditedData() {
    const editedData: EditedData = {
      title : this.uploadForm.get('title').value,
      author : {
      name : this.uploadForm.get('author').get('name').value,
      surname : this.uploadForm.get('author').get('surname').value,
      },
      summary : this.uploadForm.get('summary').value,
      language_code: "sk"
    };
    return editedData;
  }

  async getFormData(){

      const entriesData: EntriesData= {
          title : this.uploadForm.get('title').value,
          author : {
          name : this.uploadForm.get('author').get('name').value,
          surname : this.uploadForm.get('author').get('surname').value,
          },
          contributors: this.getContributors(),
          summary : this.uploadForm.get('summary').value,
          language_code : this.uploadForm.get('language_code').value,
          acquisitions : {
            content: await this.getBase()
          },
          };
          //console.log(entriesData);

          return entriesData;
  }

  async getBase(){
    function getBase64(file){
      return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result);
              reader.onerror = error => reject(error);
            });
        }
      const base = await getBase64(this.pdfFile);
      //console.log(base);
     return base;
     }


  getContributors(){
    let contributors = [];
    const formArray = this.uploadForm.get('contributors') as FormArray;
    for(let control of formArray.controls){
      contributors.push({name: control.get('name').value, surname :control.get('surname').value})
    }
    return contributors;
  }

  onImageDropped(file: File) {
      this.imageFile = file;
  }
  imageSelectedFromBrowse(file: File) {
      this.imageFile = file;
  }
  removeImage() {
      this.imageFile = null;
  }

  onPDFDropped(file: File) {
    this.pdfFile = file;
  }
  PDFSelectedFromBrowse(file: File) {
      this.pdfFile = file;
  }
  removePDF() {
      this.pdfFile = null;
  }

  formatFileSize(bytes: number, decimals = 0) {
      if (bytes === 0) {
          return '0 Bytes';
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    //console.log(this.validSize);
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

checkImageSize() {
  //console.log(this.file.size);
  if(this.imageFile.size<5*1024*1024) {
    this.validSize = true;
    return true;
  }

  else {
    this.validSize = false;
    return false;
  }
}
}
