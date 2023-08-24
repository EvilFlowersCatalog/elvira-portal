import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatPaginator } from '@angular/material/paginator';
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
  implements AfterViewInit {
  displayedColumns: string[] = ['title', 'author', 'edit', 'delete'];
  resultsLength = 0;
  entries: Entry[] = [];
  fetchDocuments$ = new Subject();
  searchForm: UntypedFormGroup;
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly entryService: EntryService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
  ) {
    super();
    this.searchForm = new UntypedFormGroup({
      searchInput: new UntypedFormControl(),
    });
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
            page: this.paginator.pageIndex ?? 0,
            limit: this.paginator.pageSize ?? 15,
            title: this.searchForm?.value.searchInput ?? "",
          }
          )
        )
      )
      .subscribe((data) => {
        this.entries = data.items;
        this.resultsLength = data.metadata.total;
        this.paginator.pageIndex = data.metadata.page - 1;
      });
  }

  documentPagination() {
    this.fetchDocuments$.next();
  }

  //Button, to navigate to the upload formular
  newDocument($event: PointerEvent) {
    this.navigationService.modifiedNavigation('/admin/upload', $event);
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
        this.fetchDocuments$.next(); // update
      });
  }

  // Function for editing document
  editDocument(entry: Entry) {
    this.navigationService.modifiedNavigation(`/admin/edit/${entry.id}`);
  }

  //Function for searchbar
  applyFilter() {
    this.fetchDocuments$.next();
  }
}
