import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { Subject } from 'rxjs';
import { concatMap, startWith, take, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { AdminService } from '../../services/admin.service';
import { AllEntryItems } from '../../services/admin.types';
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
  displayedColumns: string[] = ['title', 'name', 'surname', 'edit', 'delete'];
  resultsLength = 0;
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  isdelete: boolean = false;
  isedit: boolean = false;
  fetchDocuments$ = new Subject();

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService
  ) {
    super();
  }

  //Pass info to pagination
  ngAfterViewInit() {
    this.fetchDocuments$
      .asObservable()
      .pipe(
        takeUntil(this.destroySignal$),
        startWith([]),
        concatMap(() =>
          this.adminService.getAllEntries(
            this.paginator.pageIndex,
            this.paginator.pageSize
          )
        )
      )
      .subscribe((data) => {
        console.log(data);
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
      });
  }

  documentPagination() {
    this.adminService
      .getAllEntries(this.paginator.pageIndex, this.paginator.pageSize)
      .subscribe((datas) => {
        this.tableData = datas.items;
        console.log(this.resultsLength);
        this.dataSource = new MatTableDataSource(this.tableData);
      });
  }

  //Button, to navigate to the upload formular
  newDocument() {
    this.router.navigate(['./upload'], { relativeTo: this.route });
  }

  feedsOverview() {
    this.router.navigate(['./feeds'], { relativeTo: this.route });
  }

  //Function, to get the current clicked row
  getRow(row: AllEntryItems) {
    const { isdelete } = this;
    if (isdelete) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: { title: row.title, entryApikey: row.id, source: 'admin' },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result == 'yes') {
          this.adminService
            .deleteEntry(row.id)
            .pipe(take(1))
            .subscribe(() => {
              this.fetchDocuments$.next();
            });

          const message = this.translocoService.translate(
            'lazy.adminPage.success-delete-document'
          );
          this.notificationService.success(message);
        }
        console.log(result);
      });
    }
    if (this.isedit) {
      this.router.navigate([`./${row.id}`], { relativeTo: this.route });
    }
  }

  //Function, to give choice, wether we want to delete the document or not
  deleteDocument() {
    this.isdelete = true;
    this.isedit = false;
  }

  editDocument() {
    this.isdelete = false;
    this.isedit = true;
  }

  //Function for searchbar
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
