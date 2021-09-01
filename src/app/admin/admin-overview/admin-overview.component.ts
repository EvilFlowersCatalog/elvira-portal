import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/admin/dialogs/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AdminService } from '../services/admin.service';
import { addNewFeed, AllEntryItems, AllFeedsItems, UpdateFeeds } from '../services/admin.types';
import { NewFeedDialogComponent } from 'src/app/admin/dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateDialogComponent } from 'src/app/admin/dialogs/update-dialog/update-dialog.component';
import { NotificationService } from 'src/app/common/services/notification/notification.service';
import { TranslocoService } from '@ngneat/transloco';
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { concatMap, startWith, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
  providers: [ChangeListenerService]
})


export class AdminOverviewComponent extends DisposableComponent implements AfterViewInit  {
  displayedColumns: string[] = ['title', 'name', 'surname', 'edit', 'delete'];
  currentRow: number = 0;
  resultsLength = 0;
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  isdelete: boolean = false;
  isedit: boolean = false;
  tabIndex: number = 0;
  isFeedLoaded: boolean = false;
  isDocumentLoaded: boolean = false;
  documentPage: number = 1;
  documentSize: number = 5;
  feedPage: number = 1;
  feedSize: number = 5;
  deleteDocumentId: number;


  displayedColumnsFeed: string[] = ['feed', 'edit', 'delete'];
  tableDataFeed: AllFeedsItems[] = [];
  dataSourceFeed: MatTableDataSource<AllFeedsItems>;
  resultsLengthFeed = 0;
  isdeleteFeed: boolean = false;
  iseditFeed: boolean = false;
  deletedFeedId: number;
  iterator: number;
  isloaded: boolean = false;

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('Feedpaginator') Feedpaginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService,
    private readonly notificationService: NotificationService,
    private translocoService: TranslocoService,
    private readonly changeListenerService: ChangeListenerService,
  ) {
    super();
  }

  //Pass info to pagination
  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      this.tabIndex = params['index'];
      if(this.isloaded){
        this.getDataPagination();
      }
      this.isloaded = true;
    })

    this.changeListenerService
    .listenToChange()
    .pipe(
      startWith({}),
        takeUntil(this.destroySignal$),
        concatMap(() => this.getOverviewData())
    ).subscribe();
  }

  getDataPagination(){
      if(this.tabIndex == 1){
        return this.adminService.getAllFeedsPagination(this.Feedpaginator.pageIndex, this.Feedpaginator.pageSize).subscribe(
            datas => {
              this.tableDataFeed = datas.items;
              this.resultsLengthFeed = datas.metadata.total;
              this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
            }
          );
      }
      if(this.tabIndex == 0){
       return this.adminService.getAllEntries(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
          datas => {
          this.tableData = datas.items;
          this.resultsLength = datas.metadata.total;
          this.dataSource = new MatTableDataSource(this.tableData);
        }
        );
      }
  }

  getOverviewData(){
      if(this.tabIndex == 1){
        return this.adminService.getAllFeedsPagination(this.Feedpaginator.pageIndex ?? 0, this.Feedpaginator.pageSize ?? 5).pipe(
          tap(
            datas => {
              this.tableDataFeed = datas.items;
              this.resultsLengthFeed = datas.metadata.total;
              this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
              this.dataSourceFeed.paginator = this.Feedpaginator;
            }
          ));
      }
      if(this.tabIndex == 0){
       return this.adminService.getAllEntries(this.paginator.pageIndex ?? 0, this.paginator.pageSize ?? 5).pipe(
          tap(
          datas => {
          this.tableData = datas.items;
          this.resultsLength = datas.metadata.total;
          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
        }
        ));
      }
  }

  documentPagination(){
    this.adminService.getAllEntries(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
      datas => {
        this.tableData = datas.items;
        //this.resultsLength = datas.metadata.total;
        console.log(this.resultsLength);
        this.dataSource = new MatTableDataSource(this.tableData);
      }
    );

  }

  feedPagination(){
    this.adminService.getAllFeedsPagination(this.Feedpaginator.pageIndex, this.Feedpaginator.pageSize).subscribe(
      datas => {
        this.tableDataFeed = datas.items;
        this.resultsLengthFeed = datas.metadata.total;
        this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
        this.dataSourceFeed.paginator = this.Feedpaginator;
      }
    );

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
    if (this.isdelete) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: { title: row.title, entryApikey: row.id, source: 'admin' },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if(result == 'yes'){
          this.adminService.deleteEntry(row.id).subscribe(
            () => {
              this.changeListenerService.statusChanged();
            }
          );

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

  createNewFeed(){
    const dialogRef = this.dialog.open(NewFeedDialogComponent, {
      width: '350px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result != 'no'){
        this.adminService.addNewFeed(this.getFeedData(result)).subscribe(
          () => {
            this.changeListenerService.statusChanged()
          }
        )
        const message = this.translocoService.translate(
      'lazy.adminPage.success-message-feed'
    );
    this.notificationService.success(message);
      }
    });
  }

  getFeedData(newFeed){
    const feedData: addNewFeed = {
      catalog_id: "95e2b439-4851-4080-b33e-0adc1fd90196",
      title: newFeed,
      url_name: newFeed,
      content: "Some popular shit over there",
      kind: "navigation"
    }
    return feedData;
  }

  //Function, to get the current clicked row
  getRowFeed(row: AllFeedsItems){
    if(this.isdeleteFeed){
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: {title: row.title, entryApikey: row.id, source: "feed"},
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result == 'yes'){
          this.adminService.deleteFeed(row.id).subscribe(
            () => {
              this.changeListenerService.statusChanged();
            }
          );
        }
      const message = this.translocoService.translate(
        'lazy.adminPage.success-delete-feed'
      );
      this.notificationService.success(message);
      });
    }
    if(this.iseditFeed){
      const dialogRef = this.dialog.open(UpdateDialogComponent, {
        width: '350px',
        data: {feedId: row.id, oldFeed: row.title, newFeed: "", catalogId: row.catalog_id, url: row.url_name, content: row.content, kind: row.kind},
      });

      dialogRef.afterClosed().subscribe(result => {
        if(result != 'no'){
          this.adminService
      .updateFeed(row.id, this.getFeedsData(row, result))
      .subscribe(
        () => {
          this.changeListenerService.statusChanged();
        }
      );
      const message = this.translocoService.translate(
        'lazy.adminPage.success-message-upload'
      );
      this.notificationService.success(message);
        }
      });
    }
    //console.log(this.deleteEntryId);
  }

  getFeedsData(row, newFeed) {
    const feedsData: UpdateFeeds = {
      catalog_id: row.catalog_id,
      title: newFeed,
      url_name: row.url_name,
      content: row.content,
      kind: row.kind,
    };
    return feedsData;
  }
  //Function, to give choice, wether we want to delete the document or not
  deleteFeed(){
    this.isdeleteFeed = true;
    this.iseditFeed = false;
  }

  editFeed(){
    this.isdeleteFeed = false;
    this.iseditFeed = true;
  }

  //Function for searchbar
  applyFilterFeed(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSourceFeed.filter = filterValue.trim().toLowerCase();

    if (this.dataSourceFeed.paginator) {
      this.dataSourceFeed.paginator.firstPage();
    }
  }

  addSubjectDataFeed(){
    // this.feedService.stringSubject.subscribe(
    //   data =>
    //   {
    //     console.log('next subscribed value: ' + data);
    //     this.tableDataFeed.push(data);
    //   }
    // );
  }
}
