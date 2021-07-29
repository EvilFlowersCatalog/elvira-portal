import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/common/delete-dialog/delete-dialog.component';
import {MatTableDataSource} from '@angular/material/table';

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
  { index: 7, title: 'Laci', authorName: 'Ladislav', authorSurname: 'Sokol'}
];

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements OnInit {
  displayedColumns: string[] = ['title', 'authorName', 'authorSurname', 'edit', 'delete'];
  dataSource = new MatTableDataSource(datas);
  currentRow: number = 0;
  currentTitle: string;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  newDocument() {
    this.router.navigate(['./upload'], { relativeTo: this.route });
  }

  getRow(row: Catalog){
    this.currentRow = row.index;
    this.currentTitle = row.title;
    console.log(this.currentRow);
  }

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

  editDocument(){
    setTimeout(() => {
      this.router.navigate([`./${this.currentRow}`], { relativeTo: this.route });
    }, 500);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
