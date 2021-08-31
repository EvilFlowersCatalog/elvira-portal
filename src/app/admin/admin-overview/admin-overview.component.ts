import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/admin/dialogs/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AdminService } from '../services/admin.service';
import { addNewFeed, AllEntryItems, AllFeedsItems } from '../services/admin.types';
import { NewFeedDialogComponent } from 'src/app/admin/dialogs/new-feed-dialog/new-feed-dialog.component';
import { UpdateDialogComponent } from 'src/app/admin/dialogs/update-dialog/update-dialog.component';
import { FeedAddService } from '../services/feed-add.service';
import { DocumentAddService } from '../services/document-add.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
})


export class AdminOverviewComponent implements AfterViewInit  {
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

  @ViewChild('paginator') paginator: MatPaginator;
  @ViewChild('Feedpaginator') Feedpaginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService,
    private readonly feedService: FeedAddService,
    private readonly documentService: DocumentAddService
  ) {
    //this.paginator.pageIndex = 1;
    //this.paginator.pageSize = 5;
  //   this.route.queryParams.subscribe(params => {
  //     this.tabIndex = params['index'];
  //     if(this.tabIndex == 1){
  //       // console.log(this.paginator.page);
  //       // console.log(this.paginator.pageIndex);
  //       // console.log(this.paginator.pageSize);
  //     //   this.adminService.getAllFeedsPagination(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
  //     //   datas => {
  //     //     //console.log(datas);
  //     //     this.tableDataFeed = datas.items;
  //     //     this.resultsLengthFeed = datas.metadata.total;
  //     //     this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
  //     //     this.dataSourceFeed.paginator = this.Feedpaginator;
  //     //   }
  //     // );
  //     }
  //     if(this.tabIndex == 0 && !this.isDocumentLoaded){
  //       this.isDocumentLoaded = true;
  //       this.adminService.getAllEntries().subscribe((datas) => {
  //         //console.log(datas);
  //         this.tableData = datas.items;
  //         this.resultsLength = datas.metadata.total;
  //         this.dataSource = new MatTableDataSource(this.tableData);
  //         this.dataSource.paginator = this.paginator;
  //       });
  //     }

  // });


  }

  //Pass info to pagination
  ngAfterViewInit() {
    console.log("Hey i loaded");
    this.route.queryParams.subscribe(params => {
      this.tabIndex = params['index'];
      if(this.tabIndex == 1 && !this.isFeedLoaded){
        // console.log(this.paginator.pageIndex);
        // console.log(this.paginator.pageSize);
        console.log("cheese");
        this.isFeedLoaded = true;
        this.adminService.getAllFeedsPagination(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
        datas => {
          //console.log(datas);
          this.tableDataFeed = datas.items;
          this.resultsLengthFeed = datas.metadata.total;
          this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
          this.dataSourceFeed.paginator = this.Feedpaginator;
        }
      );
      }
      if(this.tabIndex == 0 && !this.isDocumentLoaded){
        // console.log(this.Feedpaginator.pageIndex);
        // console.log(this.Feedpaginator.pageSize);
        this.isDocumentLoaded = true;
        this.adminService.getAllEntries(this.Feedpaginator.pageIndex, this.Feedpaginator.pageSize).subscribe((datas) => {
          //console.log(datas);
          this.tableData = datas.items;
          this.resultsLength = datas.metadata.total;
          this.dataSource = new MatTableDataSource(this.tableData);
          this.dataSource.paginator = this.paginator;
        });
      }
    });
    // console.log(this.paginator.pageIndex);
    // console.log(this.paginator.pageSize);
    this.feedService.addFeedSubject.subscribe(
      data =>
      {
        console.log('next subscribed value: ' + data);
        this.tableDataFeed.push(data);
        this.resultsLengthFeed+=1;
        this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
        this.dataSourceFeed.paginator = this.Feedpaginator;
      }
    );


    this.feedService.deleteFeedSubject.subscribe(
      data =>
      {
        this.iterator = 0;
        console.log('next subscribed value: ' + data);
        this.tableDataFeed.map(
          tableData => {
            this.iterator++;
            if(tableData.id === data){
            this.deletedFeedId = this.iterator;
            }
          }
        )
        console.log(this.deletedFeedId);
        this.tableDataFeed.splice(this.deletedFeedId-1, 1);
        console.log(this.tableDataFeed);
        this.resultsLengthFeed-=1;
        this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
        this.dataSourceFeed.paginator = this.Feedpaginator;
      }
    );

    this.documentService.addDocumentSubject.subscribe(
      data =>
      {
        console.log('next subscribed value DOCUMENT: ' + data.title);
        this.tableData.push(data);
        this.resultsLength+=1;
        this.dataSource = new MatTableDataSource(this.tableData);
        this.dataSource.paginator = this.paginator;
      }
    );

    this.documentService.deleteDocumentSubject.subscribe(
      data =>
      {
        this.iterator = 0;
        console.log('next subscribed value: ' + data);
        this.tableData.map(
          tableData => {
            this.iterator++;
            if(tableData.title === data){
              console.log("fouynd asdasd");
            this.deleteDocumentId = this.iterator;
            }
          }
        )
        console.log(this.deleteDocumentId);
        this.tableData.splice(this.deleteDocumentId-1, 1);
        console.log(this.tableData);
        this.resultsLength-=1;
        this.dataSource = new MatTableDataSource(this.tableData);
        this.dataSource.paginator = this.paginator;
      }
    );
  }

  documentPagination(){
    console.log("Hello gays");
    if(this.documentPage != this.paginator.pageIndex+1){
      this.documentPage = this.paginator.pageIndex+1;
      this.adminService.getAllEntries(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
        datas => {
          //console.log(datas);
          this.tableData = datas.items;
        }
      );
    }
    else if(this.documentSize < this.paginator.pageSize){
      this.documentSize = this.paginator.pageSize;
      this.adminService.getAllEntries(this.paginator.pageIndex, this.paginator.pageSize).subscribe(
        datas => {
          //console.log(datas);
          this.tableData = datas.items;
        }
      );
    }
  }

  feedPagination(){
    if(this.feedPage != this.Feedpaginator.pageIndex+1){
      this.feedPage = this.Feedpaginator.pageIndex+1;
      this.adminService.getAllFeedsPagination(this.Feedpaginator.pageIndex, this.Feedpaginator.pageSize).subscribe(
        datas => {
          //console.log(datas);
          this.tableDataFeed = datas.items;
        }
      );
    }
    else if(this.feedSize < this.Feedpaginator.pageSize){
      this.feedSize = this.Feedpaginator.pageSize;
      this.adminService.getAllFeedsPagination(this.Feedpaginator.pageIndex, this.Feedpaginator.pageSize).subscribe(
        datas => {
          //console.log(datas);
          this.tableDataFeed = datas.items;
        }
      );
    }
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
        console.log('The dialog was closed');
      });
    }
    if (this.isedit) {
      this.router.navigate([`./${row.id}`], { relativeTo: this.route });
    }
    //console.log(this.deleteEntryId);
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
      console.log('The dialog was closed');
    });
  }

  //Function, to get the current clicked row
  getRowFeed(row: AllFeedsItems){
    if(this.isdeleteFeed){
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: {title: row.title, entryApikey: row.id, source: "feed"},
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }
    if(this.iseditFeed){
      const dialogRef = this.dialog.open(UpdateDialogComponent, {
        width: '350px',
        data: {feedId: row.id, oldFeed: row.title, newFeed: "", catalogId: row.catalog_id, url: row.url_name, content: row.content, kind: row.kind},
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }
    //console.log(this.deleteEntryId);
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
