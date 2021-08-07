import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/common/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface Catalog {
  index: number;
  title: string;
  authorName: string;
  authorSurname: string;
}

const datas: Catalog[] = [
  { index: 1, title: 'Hitchhikers guide to the galaxy1', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 2, title: 'Hitchhikers guide to the galaxy2', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 3, title: 'Hitchhikers guide to the galaxy3', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 4, title: 'Hitchhikers guide to the galaxy4', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 5, title: 'fdgjk harry potter', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 6, title: 'cheeshuadashdasdhioau;sdhoiasfhioewgoi', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 7, title: 'Laci', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 8, title: 'Hitchhikers guide to the galaxy1', authorName: 'Bence', authorSurname: 'Sokol'},
  { index: 9, title: 'Hitchhikers guide to the galaxy2', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 10, title: 'Hitchhikers guide to the galaxy3', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 11, title: 'Hitchhikers guide to the galaxy4', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 12, title: 'fdgjk harry potter', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 13, title: 'cheeshuadashdasdhioau;sdhoiasfhioewgoi', authorName: 'Ladislav', authorSurname: 'Sokol'},
  { index: 14, title: 'Laci', authorName: 'Ladislav', authorSurname: 'Sokol'}
];

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements AfterViewInit  {
  displayedColumns: string[] = ['title', 'authorName', 'authorSurname', 'edit', 'delete'];
  dataSource = new MatTableDataSource<Catalog>(datas);
  currentRow: number = 0;
  currentTitle: string;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  //Pass info to pagination
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  //Button, to navigate to the upload formular
  newDocument() {
    this.router.navigate(['./upload'], { relativeTo: this.route });
  }

  //Function, to get the current clicked row
  getRow(row: Catalog){
    this.currentRow = row.index;
    this.currentTitle = row.title;
    console.log(this.currentRow);
  }

  //Function, to give choice, wether we want to delete the document or not
  deleteDocument(){
    setTimeout(() => {
      const dialogRef = this.dialog.open(DeleteDialogComponent, {
        width: '350px',
        data: this.currentTitle
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }, 500);
  }

  //TO-DO (need data)
  editDocument(){
    setTimeout(() => {
      this.router.navigate([`./${this.currentRow}`], { relativeTo: this.route });
    }, 500);
  }

  //Function for searchbar
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}



