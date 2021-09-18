import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import {
  FormGroup,
  FormControl,
  FormArray,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  AllEntryItems,
  EditedData,
  EntriesContributors,
  EntriesData,
  OneEntryItem,
} from '../../services/admin.types';
import { TitleValidators } from '../../validators/title.validator';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { TranslocoService } from '@ngneat/transloco';
import { FiltersService } from 'src/app/library/services/filters/filters.service';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { FeedTreeNode } from 'src/app/library/library.types';
import { NestedTreeControl } from '@angular/cdk/tree';
import { EntriesService } from 'src/app/library/services/entries/entries.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-upload.component.html',
  styleUrls: ['./admin-upload.component.scss'],
})
export class AdminUploadComponent implements OnInit {
  uploadForm: FormGroup;
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
  editData: OneEntryItem;

  treeDataSource = new MatTreeNestedDataSource<FeedTreeNode>();
  treeControl = new NestedTreeControl<FeedTreeNode>((node) => node.entry);

  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;

  constructor(
    private formBuilder: FormBuilder,
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly titleValidator: TitleValidators,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly filtersService: FiltersService,
    private readonly entriesService: EntriesService
  ) {
    this.allFeeds = this.getFeeds();

    setTimeout(() => {
      this.filteredFeeds = this.feedCtrl.valueChanges.pipe(
        startWith(null),
        map((fruit: string | null) =>
          fruit ? this._filter(fruit) : this.allFeeds.slice()
        )
      );
    }, 1000);

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


  }

  get formTitle() {
    return this.uploadForm.controls['title'];
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';

  createItem(): FormGroup {
    return this.formBuilder.group({
      name: '',
      surname: '',
    });
  }

  createEditItem(name: string, surname: string): FormGroup {
    return this.formBuilder.group({
      name: name,
      surname: surname,
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



  editContributors(contributors: EntriesContributors[]){
    contributors.forEach(contributor => {
      this.addContributor();
    })
  }

  ngOnInit(): void {
    this.entryId = this.route.snapshot.paramMap.get('id');
    if (this.entryId != null && !this.isInEditMode) {
      this.adminService.getOneEntry(this.entryId).subscribe((datas) => {
        this.editData = datas;
        this.isInEditMode = true;
        datas.feeds.forEach(feed => {
          this.feeds.push(feed.title);
          this.finalFeeds.push(feed.id);
        })
        this.editContributors(datas.contributors);
      });
    }

    this.filtersService.getFeedTreeNode().subscribe((data) => {
      this.treeDataSource.data = data.entry;
    });
  }

  addFeed(id, title) {
    if (!this.feeds.includes(title)) {
      this.feeds.push(title);
      this.finalFeeds.push(id);
    }
  }

  getFeeds(): string[] {
    let feedsList: string[] = [];
    this.adminService.getAllFeeds().subscribe((datas) => {
      datas.items.map((m) => {
        if (m.kind === 'acquisition') {
          feedsList.push(m.title);
          this.feedsIdList.push(m.id);
        }
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
            this.router.navigate(['../'], { relativeTo: this.route });
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
      feeds: this.finalFeeds,
      summary: this.uploadForm.get('summary').value,
      language_code: 'sk',
      contributors: this.getContributors()
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

  returnToAdmin() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
