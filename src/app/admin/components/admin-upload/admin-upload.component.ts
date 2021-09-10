import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  FormGroup,
  FormControl,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { HttpClient } from '@angular/common/http';
import {
  AllEntryItems,
  EditedData,
  EntriesData,
} from '../../services/admin.types';
import { TitleValidators } from '../../validators/title.validator';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { TranslocoService } from '@ngneat/transloco';
//import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-upload.component.html',
  styleUrls: ['./admin-upload.component.scss'],
  //providers: [ChangeListenerService]
})
export class AdminUploadComponent implements OnInit {
  uploadForm: FormGroup;
  editForm: FormGroup;
  imageForm: FormGroup;
  contributors: FormArray;
  counter: number = 4;
  checkTitle: string;
  isTitleSame: boolean = false;
  allTitles: string[] = [];
  //Chips variables
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  feedCtrl = new FormControl();
  filteredFeeds: Observable<string[]>;
  feeds: string[] = [];
  allFeeds: string[] = [];
  feedsIdList: string[] = [];
  finalFeeds: string[] = [];
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
    private readonly titleValidator: TitleValidators,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) //private readonly changeListenerService: ChangeListenerService
  {
    this.imageForm = new FormGroup({
      file: new FormControl(null),
    });

    this.uploadForm = new FormGroup({
      title: new FormControl('', {
        validators: [Validators.required],
        asyncValidators: [titleValidator.titleValidator()],
        updateOn: 'blur',
      }),
      author: new FormGroup({
        name: new FormControl(''),
        surname: new FormControl(''),
      }),
      contributors: new FormArray([], [Validators.required]),
      summary: new FormControl(''),
      language_code: new FormControl('sk'),
    });

    this.editForm = new FormGroup({
      title: new FormControl(''),
      author: new FormGroup({
        name: new FormControl(''),
        surname: new FormControl(''),
      }),
      summary: new FormControl(''),
    });
  }

  get formTitle() {
    return this.uploadForm.controls['title'];
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      name: '',
      surname: '',
    });
  }

  addContributor(): void {
    this.contributors = this.uploadForm.get('contributors') as FormArray;
    this.contributors.push(this.createItem());
  }

  deleteContributor(index: number) {
    const add = this.uploadForm.get('contributors') as FormArray;
    add.removeAt(index);
  }

  ngOnInit(): void {
    this.allFeeds = this.getFeeds();
    this.entryId = this.route.snapshot.paramMap.get('id');
    if (this.entryId != null && !this.isInEditMode) {
      this.adminService.getOneEntry(this.entryId).subscribe((datas) => {
        this.editData = datas;
        this.isInEditMode = true;
        console.log(this.isInEditMode);
      });
    }

    this.filteredFeeds = this.feedCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) =>
        fruit ? this._filter(fruit) : this.allFeeds.slice()
      )
    );
  }

  getFeeds(): string[] {
    let feedsList: string[] = [];
    this.adminService.getAllFeeds().subscribe((datas) => {
      datas.items.map((m) => {
        feedsList.push(m.title);
        this.feedsIdList.push(m.id);
      });
    });
    return feedsList;
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
      this.finalFeeds.splice(index, 1);
      this.feeds.splice(index, 1);
    }
  }
  //Add selected chips from autocomplete
  selected(event: MatAutocompleteSelectedEvent): void {
    if (!this.feeds.includes(event.option.viewValue)) {
      this.feeds.push(event.option.viewValue);
      console.log(
        this.feedsIdList[this.allFeeds.indexOf(event.option.viewValue)]
      );
      this.finalFeeds.push(
        this.feedsIdList[this.allFeeds.indexOf(event.option.viewValue)]
      );
    }
    this.fruitInput.nativeElement.value = '';
    this.feedCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allFeeds.filter((fruit) =>
      fruit.toLowerCase().includes(filterValue)
    );
  }

  //submit button -> POST
  async formUploader() {
    if (this.isInEditMode) {
      this.adminService
        .updateEntry(this.entryId, this.getEditedData())
        .subscribe();
      this.router.navigate(['../'], { relativeTo: this.route });
    } else {
      let testData: FormData = new FormData();
      testData.append('file', this.imageFile, this.imageFile.name);
      testData.append('body', JSON.stringify(await this.getFormData()));
      if (
        this.uploadForm.status === 'VALID' &&
        this.imageFile &&
        this.pdfFile
      ) {
        if (this.validSize) {
          this.uploadForm.get('author').get('name').value,
            this.uploadForm.get('author').get('surname').value;

          this.adminService.upload(testData).subscribe(() => {
            //this.changeListenerService.statusChanged();
            this.router.navigate(['../'], { relativeTo: this.route });
            //this.router.navigate(['/library/admin'])
          });
          const message = this.translocoService.translate(
            'lazy.adminPage.success-message-document'
          );
          this.notificationService.success(message);
        } else {
          this.notificationService.error('Invalid image size!');
        }
      } else {
        this.notificationService.error('Invalid upload form!');
      }
    }
  }

  getEditedData() {
    const editedData: EditedData = {
      title: this.uploadForm.get('title').value,
      author: {
        name: this.uploadForm.get('author').get('name').value,
        surname: this.uploadForm.get('author').get('surname').value,
      },
      summary: this.uploadForm.get('summary').value,
      language_code: 'sk',
    };
    return editedData;
  }

  async getFormData() {
    const entriesData: EntriesData = {
      title: this.uploadForm.get('title').value,
      author: {
        name: this.uploadForm.get('author').get('name').value,
        surname: this.uploadForm.get('author').get('surname').value,
      },
      contributors: this.getContributors(),
      feeds: this.finalFeeds,
      summary: this.uploadForm.get('summary').value,
      language_code: this.uploadForm.get('language_code').value,
      acquisitions: [
        { relation: 'acquisition', content: await this.getBase() },
      ],
    };
    //console.log(entriesData);

    return entriesData;
  }

  getFeedId() {
    console.log('feeds');
    let feed: string[] = [];
    feed = this.getFeeds();
    console.log(feed);
  }

  async getBase() {
    function getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    }
    const base = await getBase64(this.pdfFile);
    //console.log(base);
    return base;
  }

  getContributors() {
    let contributors = [];
    const formArray = this.uploadForm.get('contributors') as FormArray;
    for (let control of formArray.controls) {
      contributors.push({
        name: control.get('name').value,
        surname: control.get('surname').value,
      });
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
    if (this.imageFile.size < 1024 * 1024) {
      this.validSize = true;
      return true;
    } else {
      this.validSize = false;
      return false;
    }
  }
}
