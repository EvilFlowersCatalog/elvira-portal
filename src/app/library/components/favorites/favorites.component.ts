import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { startWith, takeUntil, tap } from 'rxjs/operators';
import { AllEntryItems } from 'src/app/admin/services/admin.types';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { ChangeListenerService } from 'src/app/common/services/change-listener/change-listener.service';
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
export class FavoritesComponent extends DisposableComponent implements OnInit {
  entriesResponse$: Observable<ListEntriesResponse>;
  entries: EntriesItem[] = [];
  tableData: AllEntryItems[] = [];
  dataSource: MatTableDataSource<AllEntryItems>;
  resultsLength = 0;

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private readonly entriesService: EntriesService,
    private readonly changeListenerService: ChangeListenerService
  ) {
    super();
  }

  ngOnInit(): void {
    this.getEntries();
    this.changeListenerService
      .listenToChange()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe(() => this.getEntries());
  }

  getEntries() {
    this.entriesService.listFavoriteEntries(0, 12).pipe(
      takeUntil(this.destroySignal$),
      tap((data) => {
        this.entries = data.items;
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  favoritePagination() {
    this.entriesService
      .listFavoriteEntries(this.paginator.pageIndex, this.paginator.pageSize)
      .subscribe((data) => {
        this.entries = data.items;
        this.tableData = data.items;
        this.resultsLength = data.metadata.total;
        this.dataSource = new MatTableDataSource(this.tableData);
        //this.dataSource.paginator = this.paginator;
      });
  }
}
