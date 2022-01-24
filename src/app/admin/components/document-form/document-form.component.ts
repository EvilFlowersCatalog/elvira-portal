import { Component, OnInit } from '@angular/core';
import { throwError } from 'rxjs';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { catchError, take, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  EditedData,
  EntriesContributors,
  EntriesData,
  OneEntryItem,
} from '../../types/admin.types';
import { TitleValidators } from '../../validators/title.validator';
import { NotificationService } from 'src/app/common/services/notification.service';
import { TranslocoService } from '@ngneat/transloco';
import { FiltersService } from 'src/app/library/services/filters.service';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { FeedTreeNode } from 'src/app/library/types/library.types';
import { NestedTreeControl } from '@angular/cdk/tree';
import { EntriesService } from 'src/app/library/services/entries.service';

@Component({
  selector: 'app-admin',
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss'],
})
export class DocumentFormComponent implements OnInit {
  uploadForm: FormGroup;
  imageForm: FormGroup;
  contributors: FormArray;
  feeds: { title: string; id: string }[] = [];
  imageFile: File;
  pdfFile: File;
  validSize: boolean = false;
  entryId: string;
  isInEditMode: boolean = false;
  treeDataSource = new MatTreeNestedDataSource<FeedTreeNode>();
  treeControl = new NestedTreeControl<FeedTreeNode>((node) => node.entry);

  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly titleValidator: TitleValidators,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly filtersService: FiltersService
  ) {
    this.imageForm = new FormGroup({
      file: new FormControl(null),
    });

    this.uploadForm = new FormGroup({
      title: new FormControl('', {
        validators: [Validators.required],
        asyncValidators: [titleValidator.titleValidator()],
        updateOn: 'blur',
      }),
      authorName: new FormControl('', Validators.required),
      authorSurname: new FormControl('', Validators.required),
      contributors: new FormArray([]),
      summary: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.filtersService.getFeedTreeNode().subscribe((data) => {
      this.treeDataSource.data = data.entry;
    });

    this.entryId = this.route.snapshot.paramMap.get('id');
    if (this.entryId) {
      this.isInEditMode = true;
      this.adminService.getOneEntry(this.entryId).subscribe((res) => {
        this.initUploadForm(res);
        this.feeds = res.feeds.map((feed) => {
          return { title: feed.title, id: feed.id };
        });
        this.initContributors(res.contributors);
      });
    }
  }

  initUploadForm(data: OneEntryItem) {
    this.uploadForm.patchValue({
      title: data.title,
      authorName: data.author.name,
      authorSurname: data.author.surname,
      summary: data.summary,
    });
  }

  get formTitle() {
    return this.uploadForm.controls['title'];
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';

  addContributor(name?: string, surname?: string): void {
    this.contributors = this.uploadForm.get('contributors') as FormArray;
    this.contributors.push(
      new FormGroup({
        name: new FormControl(name ?? '', Validators.required),
        surname: new FormControl(surname ?? '', Validators.required),
      })
    );
  }

  deleteContributor(index: number) {
    const add = this.uploadForm.get('contributors') as FormArray;
    add.removeAt(index);
  }

  initContributors(contributors: EntriesContributors[]) {
    contributors.forEach((contributor) => {
      this.addContributor(contributor.name, contributor.surname);
    });
  }

  addFeed(feed) {
    if (!this.feeds.includes({ title: feed.title, id: feed.id })) {
      this.feeds.push({ title: feed.title, id: feed.id });
    }
  }

  removeFeed(feed) {
    const index = this.feeds.indexOf(feed);

    if (index >= 0) {
      this.feeds.splice(index, 1);
    }
  }

  async onSubmit() {
    if (this.isInEditMode) {
      this.adminService
        .updateEntry(this.entryId, this.getEditedData())
        .pipe(
          tap(() => {
            const message = this.translocoService.translate(
              'lazy.adminPage.success-message-edit-document'
            );
            this.notificationService.success(message);
            this.router.navigate(['../../'], { relativeTo: this.route });
          }),
          take(1),
          catchError((err) => {
            console.log(err);
            const message = this.translocoService.translate(
              'lazy.adminPage.error-edit-document'
            );
            this.notificationService.error(message);
            return throwError(err);
          })
        )
        .subscribe();
    } else {
      let testData: FormData = new FormData();
      testData.append('file', this.imageFile, this.imageFile.name);
      testData.append('body', JSON.stringify(await this.getFormData()));

      if (this.uploadForm.invalid) {
        this.notificationService.error('Invalid upload form!');
      } else if (!this.validSize) {
        this.notificationService.error('Invalid image size!');
      } else if (!this.imageFile || !this.pdfFile) {
        this.notificationService.error('Seems like some files are missing!');
      } else {
        this.adminService
          .upload(testData)
          .pipe(
            tap(() => {
              const message = this.translocoService.translate(
                'lazy.adminPage.success-message-document'
              );
              this.notificationService.success(message);
              this.router.navigate(['../'], { relativeTo: this.route });
            }),
            take(1),
            catchError((err) => {
              console.log(err);
              const message = this.translocoService.translate(
                'lazy.adminPage.error-upload-document'
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
      acquisitions: [
        { relation: 'acquisition', content: await this.getBase() },
      ],
    };

    return entriesData;
  }

  async getBase() {
    const getBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };
    const base = await getBase64(this.pdfFile);
    return base;
  }

  getContributors() {
    const formArray = this.uploadForm.get('contributors') as FormArray;
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
