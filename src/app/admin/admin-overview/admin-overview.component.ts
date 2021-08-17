import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/common/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AdminService } from '../services/admin.service';
import { AllEntryItems, AllFeedsItems } from '../services/admin.types';
import { UpdateDialogComponent } from 'src/app/common/update-dialog/update-dialog.component';
import { NewFeedDialogComponent } from 'src/app/common/new-feed-dialog/new-feed-dialog.component';
import { FlexAlignStyleBuilder } from '@angular/flex-layout';


@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss']
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

  displayedColumnsFeed: string[] = ['feed', 'edit', 'delete'];
  tableDataFeed: AllFeedsItems[] = [];
  dataSourceFeed: MatTableDataSource<AllFeedsItems>;
  resultsLengthFeed = 0;
  isdeleteFeed: boolean = false;
  iseditFeed: boolean = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService,
  ) {
    this.route.queryParams.subscribe(params => {
      this.tabIndex = params['index'];
      if(this.tabIndex == 1 && !this.isFeedLoaded){
        this.isFeedLoaded = true;
        this.adminService.getAllFeeds().subscribe(
        datas => {
          console.log(datas);
          this.tableDataFeed = datas.items;
          this.resultsLengthFeed = datas.metadata.total;
          this.dataSourceFeed = new MatTableDataSource(this.tableDataFeed);
          this.dataSourceFeed.paginator = this.paginator;
        }
      );
      }

  });


  }

  //Pass info to pagination
  ngAfterViewInit() {
    this.adminService.getAllEntries().subscribe(
      datas => {
        console.log(datas);
        this.tableData = datas.items;
        this.resultsLength = datas.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
        this.dataSource.paginator = this.paginator;
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
  getRow(row: AllEntryItems){
    if(this.isdelete){
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: {title: row.title, entryApikey: row.id, source: "admin"},
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }
    if(this.isedit){
      this.router.navigate([`./${row.id}`], { relativeTo: this.route });
    }
    //console.log(this.deleteEntryId);
  }

  //Function, to give choice, wether we want to delete the document or not
  deleteDocument(){
    this.isdelete = true;
    this.isedit = false;
  }

  editDocument(){
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
}



