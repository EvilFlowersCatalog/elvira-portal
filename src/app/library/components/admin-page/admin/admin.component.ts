import { Component, ViewChild, AfterViewInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'src/app/common/delete-dialog/delete-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';

export interface Catalog {
  index: number;
  title: string;
  authorName: string;
  authorSurname: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})

export class AdminComponent implements AfterViewInit  {
  displayedColumns: string[] = ['title', 'authorName', 'authorSurname', 'edit', 'delete'];
  dataSource: MatTableDataSource<Catalog>;
  currentRow: number = 0;
  currentTitle: string;
  exampleDatabase: ExampleHttpDatabase | null;
  data: Catalog[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngAfterViewInit() {
    this.exampleDatabase = new ExampleHttpDatabase();

    merge(this.paginator.page)
    .pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingResults = true;
        return this.exampleDatabase!.getRepoIssues()
      }),
      map(data => {
        // Flip flag to show that loading has finished.
        this.isLoadingResults = false;
        this.isRateLimitReached = data === null;

        if (data === null) {
          return [];
        }

        // Only refresh the result length if there is new data. In case of rate
        // limit errors, we do not want to reset the paginator to zero, as that
        // would prevent users from re-triggering requests.
        this.resultsLength = 14;
        return data;
      })
    )
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


/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDatabase {
  constructor() {}

  getRepoIssues(): Catalog[] {
    // const href = 'https://api.github.com/search/issues';
    // const requestUrl =
    //     `${href}?q=repo:angular/components&sort=${sort}&order=${order}&page=${page + 1}`;

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
    return datas;
  }
}
