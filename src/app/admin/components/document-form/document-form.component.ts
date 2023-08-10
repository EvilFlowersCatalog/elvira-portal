import { Component, OnInit } from '@angular/core';
import { throwError } from 'rxjs';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray, Validators } from '@angular/forms';
import { catchError, map, take, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  AcquisitionsItems,
  EditedData,
  EntriesContributors,
  EntriesData,
  OneEntryItem,
} from '../../types/admin.types';
import { TitleValidators } from '../../validators/title.validator';
import { NotificationService } from 'src/app/common/services/notification.service';
import { TranslocoService } from '@ngneat/transloco';
//import { FiltersService } from 'src/app/library/services/filters.service';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { EntriesItem, FeedTreeNode } from 'src/app/library/types/library.types';
import { NestedTreeControl } from '@angular/cdk/tree';
import { EntriesService } from 'src/app/library/services/entries.service';
import { FeedsService } from 'src/app/library/services/feeds.service';

@Component({
  selector: 'app-admin',
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss'],
})
export class DocumentFormComponent implements OnInit {
  uploadForm: UntypedFormGroup;
  imageForm: UntypedFormGroup;
  contributors: UntypedFormArray;
  feeds: { title: string; id: string }[] = [];
  imageFile: File;
  pdfFile: File;
  validSize: boolean = false;
  entryId: string;
  isInEditMode: boolean = false;
  dataSource: { title: string; id: string }[] = [];

  constructor(
    private readonly adminService: AdminService,
    private readonly feedsService: FeedsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly titleValidator: TitleValidators,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
  ) {
    this.imageForm = new UntypedFormGroup({
      file: new UntypedFormControl(null),
    });

    this.uploadForm = new UntypedFormGroup({
      title: new UntypedFormControl('', {
        validators: [Validators.required],
        asyncValidators: [titleValidator.titleValidator()],
        updateOn: 'blur',
      }),
      authorName: new UntypedFormControl('', Validators.required),
      authorSurname: new UntypedFormControl('', Validators.required),
      contributors: new UntypedFormArray([]),
      summary: new UntypedFormControl(''),
    });
  }

  ngOnInit(): void {
    this.feedsService.getFeeds({
      page: 1, 
      limit: 100, 
      kind: "acquisition"
    })
    .subscribe((dataSource) => {  
      dataSource.items.forEach(item => {
        this.dataSource.push({title: item.title, id: item.id});
      });
    });

    this.entryId = this.route.snapshot.paramMap.get('id');
    if (this.entryId) {
      this.isInEditMode = true;
      this.adminService.getOneEntry(this.entryId).subscribe((response) => {
        this.initUploadForm(response);
        this.feeds = response.response.feeds.map((feed) => {
          return { title: feed.title, id: feed.id };
        });
        this.initContributors(response.response.contributors);
      });
    }
  }

  initUploadForm(data: OneEntryItem) {
    this.uploadForm.patchValue({
      title: data.response.title,
      authorName: data.response.author.name,
      authorSurname: data.response.author.surname,
      summary: data.response.summary,
    });
  }

  get formTitle() {
    return this.uploadForm.controls['title'];
  }

  addContributor(name?: string, surname?: string): void {
    this.contributors = this.uploadForm.get('contributors') as UntypedFormArray;
    this.contributors.push(
      new UntypedFormGroup({
        name: new UntypedFormControl(name ?? '', Validators.required),
        surname: new UntypedFormControl(surname ?? '', Validators.required),
      })
    );
  }

  deleteContributor(index: number) {
    const add = this.uploadForm.get('contributors') as UntypedFormArray;
    add.removeAt(index);
  }

  initContributors(contributors: EntriesContributors[]) {
    contributors.forEach((contributor) => {
      this.addContributor(contributor.name, contributor.surname);
    });
  }

  addFeed(feed) {
    let contains = false
    for(let i = 0; i < this.feeds.length; i++) {
      if(this.feeds[i].id === feed.id) {
        contains = true;
        break;
      }
    }
    if (!contains && this.feeds.length < 5) {
      this.feeds.push({ title: feed.title, id: feed.id });
    }
  }

  removeFeed(feed) {
    const index = this.feeds.indexOf(feed);

    if (index >= 0) {
      this.feeds.splice(index, 1);
    }
  }

  async createOrUpdateEntry() {
    if (this.isInEditMode) {
      this.adminService
        .updateEntry(this.entryId, this.getEditedData())
        .pipe(
          tap(() => {
            const message = this.translocoService.translate(
              'lazy.documentForm.successMessageEditDocument'
            );
            this.notificationService.success(message);
            this.router.navigate(['../../'], { relativeTo: this.route });
          }),
          take(1),
          catchError((err) => {
            console.log(err);
            const message = this.translocoService.translate(
              'lazy.documentForm.errorMessageEditDocument'
            );
            this.notificationService.error(message);
            return throwError(err);
          })
        )
        .subscribe();
    } else {
      if (this.uploadForm.invalid) {
        this.notificationService.error('Invalid upload form!');
      } else if (!this.validSize) {
        this.notificationService.error('Invalid image size!');
      } else if (!this.imageFile || !this.pdfFile) {
        this.notificationService.error('Seems like some files are missing!');
      } else {
        const newEntry = await this.getFormData();
        
        this.adminService
          .upload(newEntry)
          .pipe(
            tap(async (response: OneEntryItem) => {
              
              let acquisitionData = new FormData();
              let metadata = {
                relation: "open-access",
              }
              acquisitionData.append('content', this.pdfFile);
              acquisitionData.append('metadata', JSON.stringify(metadata));

              try {
                await this.adminService.uploadAcquisition(acquisitionData, response.response.id);

                const message = this.translocoService.translate(
                  'lazy.documentForm.successMessageUploadDocument'
                );
                this.notificationService.success(message);
                this.router.navigate(['../'], { relativeTo: this.route });
              } catch (error) {
                // Ak sa niečo stane pri nahraní pdfka a nepodarí sa nahrať, vymaž vytvorenú entrie
                this.adminService
                  .deleteEntry(response.response.id)
                  .toPromise();

                  const message = this.translocoService.translate(
                    'lazy.documentForm.errorMessageUploadDocument'
                  );
                  this.notificationService.error(message);
                  return throwError(error);
              }
            }),
            take(1),
            catchError((err) => {
              const message = this.translocoService.translate(
                'lazy.documentForm.errorMessageUploadDocument'
              );
              this.notificationService.error(message);
              return throwError(err);
            })
          )
          .subscribe();
      }
    }
  }

  getEditedData() {
    const editedData: EditedData = {
      title: this.uploadForm.get('title').value,
      author: {
        name: this.uploadForm.get('authorName').value,
        surname: this.uploadForm.get('authorSurname').value,
      },
      feeds: this.feeds.map((feed) => {
        return feed.id;
      }),
      summary: this.uploadForm.get('summary').value,
      language_code: 'sk',
      contributors: this.getContributors(),
      identifiers: {
        google: "XIXIX",
        isbn: "null"
      },
    };
    return editedData;
  }

  async getFormData() {
    const entriesData: EntriesData = {
      title: this.uploadForm.get('title').value,
      author: {
        name: this.uploadForm.get('authorName').value,
        surname: this.uploadForm.get('authorSurname').value,
      },
      contributors: this.getContributors(),
      feeds: this.feeds.map((feed) => {
        return feed.id;
      }),
      summary: this.uploadForm.get('summary').value,
      language_code: 'sk',
      // acquisitions: [
      //   { relation: 'acquisition', content: await this.getBase(this.pdfFile) },
      // ],
      identifiers: {
        google: "XIXIX",
        isbn: "null"
      },
      image: await this.getBase(this.imageFile)
    };

    return entriesData;
  }

  async getBase(fileBase: File) {
    const getBase64 = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };
    const base = await getBase64(fileBase);
    return base;
  }

  getContributors() {
    const formArray = this.uploadForm.get('contributors') as UntypedFormArray;
    return formArray.controls.map((control) => {
      return {
        name: control.get('name').value,
        surname: control.get('surname').value,
      };
    });
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

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  checkImageSize() {
    if (this.imageFile.size < 1024 * 1024) {
      this.validSize = true;
      return true;
    } else {
      this.validSize = false;
      return false;
    }
  }
}
