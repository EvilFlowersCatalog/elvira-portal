import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteDialogComponent } from 'src/app/common/components/delete-dialog/delete-dialog.component';
import { UpdateDialogComponent } from 'src/app/common/components/update-dialog/update-dialog.component';
import { AdminService } from '../services/admin.service';
import { AllFeedsItems } from '../services/admin.types';

@Component({
  selector: 'app-feeds-overview',
  templateUrl: './feeds-overview.component.html',
  styleUrls: ['./feeds-overview.component.scss'],
})
export class FeedsOverviewComponent implements AfterViewInit {
  displayedColumns: string[] = ['feed', 'edit', 'delete'];
  tableData: AllFeedsItems[] = [];
  dataSource: MatTableDataSource<AllFeedsItems>;
  resultsLength = 0;
  isdelete: boolean = false;
  isedit: boolean = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly adminService: AdminService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngAfterViewInit() {
    this.adminService.getAllFeeds().subscribe((datas) => {
      console.log(datas);
      this.tableData = datas.items;
      this.resultsLength = datas.metadata.total;
      this.dataSource = new MatTableDataSource(this.tableData);
      this.dataSource.paginator = this.paginator;
    });
  }

  //Function, to get the current clicked row
  getRow(row: AllFeedsItems) {
    if (this.isdelete) {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: { title: row.title, entryApikey: row.id, source: 'feed' },
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('The dialog was closed');
      });
    }
    if (this.isedit) {
      const dialogRef = this.dialog.open(UpdateDialogComponent, {
        width: '350px',
        data: {
          feedId: row.id,
          oldFeed: row.title,
          newFeed: '',
          catalogId: row.catalog_id,
          url: row.url_name,
          content: row.content,
          kind: row.kind,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log('The dialog was closed');
      });
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
}
