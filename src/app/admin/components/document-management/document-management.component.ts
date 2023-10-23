import { AfterViewInit, Component, HostListener } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Subject, throwError } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  startWith,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';
import { NotificationService } from 'src/app/services/general/notification.service';
import { Entry } from 'src/app/types/entry.types';
import { EntryService } from 'src/app/services/entry.service';
import { NavigationService } from 'src/app/services/general/navigation.service';

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.scss'],
})
export class DocumentManagementComponent
  extends DisposableComponent
  implements AfterViewInit
{
  displayedColumns: string[] = ['title', 'author', 'edit', 'delete'];
  resultsLength = 0;
  entries: Entry[] = [];
  fetchDocuments$ = new Subject();
  searchForm: UntypedFormGroup;
  page: number = 0;
  refresh: boolean = false;
  firstScroll: boolean = true;
  resetEntries: boolean = false; // in fetch entries
  deleted: boolean = false; // when entrie is deleted
  lenght: number = 0; // for saving actual entires.lenght, for reaload (used when entry was deleted)

  constructor(
    private readonly navigationService: NavigationService,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly entryService: EntryService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      searchInput: new UntypedFormControl(),
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const windowHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const pageHeight = document.body.scrollHeight;

    // if we are at bottom and there is possible refresh, fetch entries
    if (scrollPosition + windowHeight >= pageHeight - 500 && this.refresh) {
      this.refresh = false;
      this.fetchDocuments$.next();
    }
  }

  //Pass info to pagination
  ngAfterViewInit() {
    this.fetchDocuments$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() =>
          this.entryService.getEntriesList({
            page: this.page,
            limit: this.deleted ? this.lenght : 25,
            title: this.searchForm?.value.searchInput ?? '',
            order_by: '-created_at',
          })
        )
      )
      .subscribe((data) => {
        this.deleted = false; // reset deleted
        if (this.resetEntries) {
          this.resetEntries = false;
          this.entries = data.items;
        } else {
          this.entries.push(...data.items); // push
        }

        // When user comes to library first time scroll up or entries were reseted (reset funtion)
        if (this.firstScroll) {
          this.firstScroll = false;
          window.scrollTo(0, 0);
        }

        // Check if actuall page is last or not, if not user can refresh
        if (this.page !== data.metadata.pages - 1) {
          this.refresh = true;
          this.page += 1; // next page
        }
      });
  }

  //Button, to navigate to the upload formular
  newDocument(event: any) {
    this.navigationService.modifiedNavigation('/elvira/admin/upload', event);
  }

  //Function, to give choice, wether we want to delete the document or not
  deleteDocument(entry: Entry) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: { title: entry.title },
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter((result) => result === 'yes'),
        concatMap(() => this.entryService.deleteEntry(entry.id)),
        tap(() => {
          const message = this.translocoService.translate(
            'lazy.documentManagement.successMessageDeleteDocument'
          );
          this.notificationService.success(message);
        }),
        catchError((err) => {
          console.log(err);
          const message = this.translocoService.translate(
            'lazy.documentManagement.errorMessageDeleteDocument'
          );
          this.notificationService.error(message);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.lenght = this.entries.length;
        this.deleted = true;
        this.fetchDocuments$.next(); // update
      });
  }

  // Function for editing document
  editDocument(entry: Entry) {
    this.navigationService.modifiedNavigation(`/elvira/admin/edit/${entry.id}`);
  }

  //Function for searchbar
  applyFilter() {
    this.page = 0;
    this.resetEntries = true;
    this.firstScroll = true;
    this.fetchDocuments$.next();
  }
}
