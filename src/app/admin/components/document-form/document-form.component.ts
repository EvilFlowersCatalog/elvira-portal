import { Component, OnInit } from '@angular/core';
import { throwError } from 'rxjs';
import {
  UntypedFormGroup,
  UntypedFormControl,
  UntypedFormArray,
  Validators,
} from '@angular/forms';
import { catchError, take, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { FeedService } from 'src/app/services/feed.service';
import { NotificationService } from 'src/app/services/general/notification.service';
import { EntryService } from 'src/app/services/entry.service';
import { EntryDetail, EntryInfo, EntryNew } from 'src/app/types/entry.types';
import { EntryAuthor } from 'src/app/types/author.types';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Feed } from 'src/app/types/feed.types';
import { AddFeedDialogComponent } from '../dialogs/add-feed-dialog/add-feed-dialog.component';
import { IdentifiersType } from 'src/app/types/general.types';

@Component({
  selector: 'app-admin',
  templateUrl: './document-form.component.html',
  styleUrls: ['./document-form.component.scss'],
})
export class DocumentFormComponent implements OnInit {
  uploadForm: UntypedFormGroup; // used in html
  contributors: UntypedFormArray; // used in html
  feeds: { title: string; id: string }[] = []; //used in html
  imageFile: File; // used in html
  pdfFile: File; // used in html
  validSize: boolean = false; // used in html
  entry_id: string = this.route.snapshot.paramMap.get('id') ?? '';
  isInEditMode: boolean = false; // used in html
  dataSource: { title: string; id: string }[] = []; // used in html
  IdentifiersType = IdentifiersType;

  constructor(
    private readonly feedService: FeedService,
    private readonly router: Router,
    public dialog: MatDialog,
    private readonly entryService: EntryService,
    private readonly route: ActivatedRoute,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    this.uploadForm = new UntypedFormGroup({
      title: new UntypedFormControl('', Validators.required),
      authorName: new UntypedFormControl('', Validators.required),
      authorSurname: new UntypedFormControl('', Validators.required),
      contributors: new UntypedFormArray([]),
      citation: new UntypedFormControl(''),
      isbn: new UntypedFormControl(''),
      doi: new UntypedFormControl(''),
      year: new UntypedFormControl(''),
      publisher: new UntypedFormControl(''),
      summary: new UntypedFormControl(''),
    });
  }

  ngOnInit(): void {
    // Get acquisition feeds
    this.feedService
      .getFeedsList({
        page: 0,
        limit: 100,
        kind: 'acquisition',
        order_by: 'title',
      })
      .subscribe((dataSource) => {
        dataSource.items.forEach((item) => {
          this.dataSource.push({ title: item.title, id: item.id }); // set to dataSource in way we want
        });
      });

    // if we have entry_id
    if (this.entry_id) {
      // is there
      this.isInEditMode = true; // it means we are in edit mode
      this.entryService
        .getEntryDetail(this.entry_id) // get details of given entry
        .subscribe((response) => {
          // Set everything in form
          this.initUploadForm(response);
          this.initFeeds(response.response.feeds);
          this.initContributors(response.response.contributors);

          this.convertToImageFile(response.response.thumbnail); // convert thumbnail to image
        });
    }
  }

  // Get image type
  getImageType(base64Image: string): string {
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,/);
    if (matches && matches.length === 2) {
      return matches[1]; // The image type (e.g., 'jpeg' or 'png')
    } else {
      // Default to 'jpeg' if the image type can't be determined
      return 'jpeg';
    }
  }

  // Convert base64 to image file
  convertToImageFile(base64: string): void {
    const imageType = this.getImageType(base64); // get image type
    // replace first info, (cuz it will pass the atob func)
    const base64WithoutPrefix = base64.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ''
    );
    // encode
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${imageType}` }); // create Blob
    // Set image
    this.imageFile = new File([blob], 'Picture', {
      type: `image/${imageType}`,
    });
  }

  // Set data in edit mode to form
  initUploadForm(data: EntryDetail) {
    this.uploadForm.patchValue({
      title: data.response.title,
      authorName: data.response.author.name,
      authorSurname: data.response.author.surname,
      summary: data.response.summary,
      doi: data.response.identifiers.doi,
      isbn: data.response.identifiers.isbn,
      citation: data.response.citation,
      year: data.response.year,
      publisher: data.response.publisher,
    });
  }

  initFormFromIdentifier(data: EntryInfo) {
    this.uploadForm.patchValue({
      title: data.response.title,
      authorName: data.response.authors[0].name,
      authorSurname: data.response.authors[0].surname,
      doi: data.response.doi,
      citation: data.response.bibtex,
      year: data.response.year,
      publisher: data.response.publisher,
    });
    this.initContributors(data.response.authors.slice(1));
  }

  // get title
  get formTitle() {
    return this.uploadForm.controls['title'];
  }

  // Add contributors
  addContributor(name?: string, surname?: string): void {
    this.contributors = this.uploadForm.get('contributors') as UntypedFormArray;
    this.contributors.push(
      new UntypedFormGroup({
        name: new UntypedFormControl(name ?? '', Validators.required),
        surname: new UntypedFormControl(surname ?? '', Validators.required),
      })
    );
  }

  // Delete contributor
  deleteContributor(index: number) {
    const add = this.uploadForm.get('contributors') as UntypedFormArray;
    add.removeAt(index);
  }

  // In editmode, get contributors
  initContributors(contributors: EntryAuthor[]) {
    contributors.forEach((contributor) => {
      this.addContributor(contributor.name, contributor.surname);
    });
  }

  // in editmode, get feeds
  initFeeds(feeds: Feed[]) {
    this.feeds = feeds.map((feed) => {
      return { title: feed.title, id: feed.id };
    });
  }

  // add feed
  addFeeds() {
    const dialogRef = this.dialog.open(AddFeedDialogComponent, {
      width: '700px',
      maxWidth: '95%',
      data: {},
    });

    // after dialog is closed
    dialogRef
      .afterClosed()
      .subscribe((result: { title: string; id: string }) => {
        if (result) {
          let contains = false;
          // Check if it's already used
          for (let i = 0; i < this.feeds.length; i++) {
            if (this.feeds[i].id === result.id) {
              contains = true;
              break;
            }
          }
          // if not push it
          if (!contains && this.feeds.length < 5) {
            this.feeds.push({ title: result.title, id: result.id });
          }
        }
      });
  }

  // remove feed
  removeFeed(feed) {
    const index = this.feeds.indexOf(feed);
    if (index >= 0) {
      this.feeds.splice(index, 1);
    }
  }

  // Creare or update func
  async createOrUpdateEntry() {
    // If is in edit mode
    if (this.isInEditMode) {
      if (this.uploadForm.invalid) {
        // if something missing
        this.notificationService.error('Invalid upload form!');
      } else if (!this.validSize) {
        // if image has not valid size
        this.notificationService.error('Invalid image size!');
      } else if (!this.imageFile) {
        // if there is no image
        this.notificationService.error('Seems like some files are missing!');
      } else {
        // if everything is fine
        this.entryService
          .updateEntry(this.entry_id, await this.getFormData()) // get edited data
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
              if (err.status === 409) {
                const message = this.translocoService.translate(
                  'lazy.documentForm.errorMessageSimilarityDocument'
                );
                this.notificationService.error(message);
              } else {
                const message = this.translocoService.translate(
                  'lazy.documentForm.errorMessageEditDocument'
                );
                this.notificationService.error(message);
              }
              return throwError(err);
            })
          )
          .subscribe();
      }
    }
    // Else is not in edited mode.. so it's upload
    else {
      if (this.uploadForm.invalid) {
        // if anything is missing
        this.notificationService.error('Invalid upload form!');
      } else if (!this.validSize) {
        // if image has not valid size
        this.notificationService.error('Invalid image size!');
      } else if (!this.imageFile || !this.pdfFile) {
        // if there is no image or pdf
        this.notificationService.error('Seems like some files are missing!');
      } else {
        // if everything is fine
        const newEntry = await this.getFormData(); // get data

        this.entryService
          .createEntry(newEntry)
          .pipe(
            tap(async (response: EntryDetail) => {
              // if entry was created create acquisition as FormData
              let acquisitionData = new FormData();
              let metadata = {
                relation: 'open-access',
              };
              acquisitionData.append('content', this.pdfFile);
              acquisitionData.append('metadata', JSON.stringify(metadata));

              try {
                // upload acquistion
                await this.entryService.uploadEntryAcquisition(
                  acquisitionData,
                  response.response.id
                );

                const message = this.translocoService.translate(
                  'lazy.documentForm.successMessageUploadDocument'
                );
                this.notificationService.success(message);
                this.router.navigate(['../'], { relativeTo: this.route });
              } catch (error) {
                // If something went wrong during uploading file, delete created entry
                this.entryService.deleteEntry(response.response.id).subscribe();

                const message = this.translocoService.translate(
                  'lazy.documentForm.errorMessageUploadDocument'
                );
                this.notificationService.error(message);
                return throwError(error);
              }
            }),
            take(1),
            catchError((err) => {
              if (err.status === 409) {
                const message = this.translocoService.translate(
                  'lazy.documentForm.errorMessageSimilarityDocument'
                );
                this.notificationService.error(message);
              } else {
                const message = this.translocoService.translate(
                  'lazy.documentForm.errorMessageUploadDocument'
                );
                this.notificationService.error(message);
              }
              return throwError(err);
            })
          )
          .subscribe();
      }
    }
  }

  // Get data
  async getFormData() {
    // Set data
    const entry: EntryNew = {
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
        doi: this.uploadForm.get('doi').value
          ? this.uploadForm.get('doi').value
          : null,
        isbn: this.uploadForm.get('isbn').value
          ? this.uploadForm.get('isbn').value
          : null,
      },
      citation: this.uploadForm.get('citation').value
        ? this.uploadForm.get('citation').value
        : null,
      year: this.uploadForm.get('year').value
        ? this.uploadForm.get('year').value
        : null,
      publisher: this.uploadForm.get('publisher').value
        ? this.uploadForm.get('publisher').value
        : null,
      image: await this.getBase(this.imageFile),
    };
    return entry;
  }

  // Create Base64 file
  async getBase(fileBase: File) {
    // func for creating
    const getBase64 = (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };
    // file
    const base = await getBase64(fileBase);
    return base;
  }

  // Get contributors
  getContributors() {
    const formArray = this.uploadForm.get('contributors') as UntypedFormArray;
    return formArray.controls.map((control) => {
      return {
        name: control.get('name').value,
        surname: control.get('surname').value,
      };
    });
  }

  // Functions for image
  onImageDropped(file: File) {
    this.imageFile = file;
  }
  imageSelectedFromBrowse(file: File) {
    this.imageFile = file;
  }
  removeImage() {
    this.imageFile = null;
  }

  // Functions for pdf
  onPDFDropped(file: File) {
    this.pdfFile = file;
  }
  PDFSelectedFromBrowse(file: File) {
    this.pdfFile = file;
  }
  removePDF() {
    this.pdfFile = null;
  }

  // Get file size
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

  // Check if image has valid size
  checkImageSize() {
    if (this.imageFile.size < 1024 * 1024 * 5) {
      // 5MB
      this.validSize = true;
      return true;
    } else {
      this.validSize = false;
      return false;
    }
  }

  getData(type: IdentifiersType) {
    if (this.uploadForm.get(type).value !== '') {
      this.entryService
        .getEntryInfo(type, this.uploadForm.get(type).value)
        .toPromise()
        .then((data) => {
          this.initFormFromIdentifier(data);

          const message = this.translocoService.translate(
            'lazy.documentForm.getDataSuccessful'
          );
          this.notificationService.success(message);
        })
        .catch(() => {
          const message = this.translocoService.translate(
            'lazy.documentForm.getDataUnsuccessful'
          );
          this.notificationService.error(message);
        });
    } else {
      const message = this.translocoService.translate(
        'lazy.documentForm.getDataInvalid',
        { section: type.toLocaleUpperCase() }
      );
      this.notificationService.error(message);
    }
  }
}
