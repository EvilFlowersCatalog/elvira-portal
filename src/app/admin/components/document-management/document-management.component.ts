import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
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
import { NotificationService } from 'src/app/common/services/notification.service';
import { AdminService } from '../../services/admin.service';
import { AllEntryItems } from '../../types/admin.types';
import { DeleteDialogComponent } from '../dialogs/delete-dialog/delete-dialog.component';

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
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  fetchDocuments$ = new Subject();
  searchForm: UntypedFormGroup;

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService,
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
          this.adminService.searchEntries(
            this.paginator.pageIndex ?? 0,
            this.paginator.pageSize ?? 5,
            this.searchForm?.value.searchInput ?? "",
          )
        )
      )
      .subscribe((data) => {
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
      });
  }

  documentPagination() {
    this.fetchDocuments$.next();
  }

  //Button, to navigate to the upload formular
  newDocument() {
    this.router.navigate(['./upload'], { relativeTo: this.route });
  }

  //Function, to give choice, wether we want to delete the document or not
  deleteDocument(element: AllEntryItems) {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: { title: element.title },
    });

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        filter((result) => result === 'yes'),
        concatMap(() => this.adminService.deleteEntry(element.id)),
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
        this.fetchDocuments$.next();
      });
  }

  editDocument(element: AllEntryItems) {
    this.router.navigate([`./edit/${element.id}`], { relativeTo: this.route });
  }

  //Function for searchbar
  applyFilter() {
    this.fetchDocuments$.next();
  }
}
