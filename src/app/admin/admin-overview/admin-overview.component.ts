import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/common/components/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AdminService } from '../services/admin.service';
import { AllEntryItems } from '../services/admin.types';

@Component({
  selector: 'app-admin',
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss'],
})
export class AdminOverviewComponent implements AfterViewInit {
  displayedColumns: string[] = ['title', 'name', 'surname', 'edit', 'delete'];
  currentRow: number = 0;
  resultsLength = 0;
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  isdelete: boolean = false;
  isedit: boolean = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog,
    private readonly adminService: AdminService
  ) {}

  //Pass info to pagination
  ngAfterViewInit() {
    this.adminService.getAllEntries().subscribe((datas) => {
      console.log(datas);
      this.tableData = datas.items;
      this.resultsLength = datas.metadata.total;
      this.dataSource = new MatTableDataSource(this.tableData);
      this.dataSource.paginator = this.paginator;
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
}
