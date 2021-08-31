import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { AllEntryItems } from 'src/app/admin/services/admin.types';
import { EntriesService } from '../../services/entries/entries.service';
import {
  EntriesItem,
  ListEntriesResponse,
} from '../../services/entries/entries.types';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent implements OnInit {
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[];
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  resultsLength = 0;

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly entriesService: EntriesService
  ) {}

  ngOnInit(): void {
    this.entriesService
      .listEntries(0, 12)
      .subscribe((data) => {
        this.entries = data.items;
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
        this.dataSource.paginator = this.paginator;
      });
  }

  favoritePagination(){
    this.entriesService
      .listEntries(this.paginator.pageIndex, this.paginator.pageSize)
      .subscribe((data) => {
        this.entries = data.items;
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
        //this.dataSource.paginator = this.paginator;
      });
  }
}
