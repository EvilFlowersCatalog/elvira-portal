import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Observable } from 'rxjs';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { Filters } from 'src/app/common/services/app-state/app-state.types';
import { Author, Authors, FeedTreeNode } from '../../library.types';
import { FiltersService } from '../../services/filters/filters.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent extends DisposableComponent implements OnInit {
  searchForm: FormGroup;
  authorForm: FormGroup;
  filters: Filters = { search: null, author: null, feed: null };
  authorSuggestions: Author[];
  FeedTreeNode: FeedTreeNode;
  treeControl = new NestedTreeControl<FeedTreeNode>((node) => node.entry);
  dataSource = new MatTreeNestedDataSource<FeedTreeNode>();
  // filteredOptions: Observable<Author[]>;

  constructor(
    private readonly filtersService: FiltersService,
    private readonly appStateService: AppStateService,
    private readonly fb: FormBuilder
  ) {
    super();
    this.searchForm = new FormGroup({ searchInput: new FormControl('') });
    this.filtersService
      .getFeedTreeNode()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data) => {
        console.log(data);
        this.dataSource.data = data.entry;
      });
  }

  ngOnInit(): void {
    this.initAuthorForm();
    const state = this.appStateService.getStateSnapshot();
    this.searchForm.patchValue({
      searchInput: state?.filters?.search,
    });
    this.authorForm.patchValue({
      authorInput: state?.filters?.author,
    });
  }

  initAuthorForm() {
    this.authorForm = this.fb.group({
      authorInput: [''],
    });

    this.authorForm
      .get('authorInput')
      .valueChanges.pipe(
        takeUntil(this.destroySignal$),
        debounceTime(300),
        distinctUntilChanged(),
        concatMap((value) => this.filtersService.getAuthorSuggestions(value))
      )
      .subscribe((response: Authors) => {
        this.authorSuggestions = response.items;
      });
  }

  patchFilter(newData) {
    const clearFilters = { search: null, author: null, feed: null };
    const newFilter = { ...clearFilters, ...newData };
    this.filters = newFilter;
  }

  applyFilter() {
    this.appStateService.patchState({
      filters: this.filters,
      sidebar: false,
      sidenav: false,
    });
  }

  search() {
    this.patchFilter({ search: this.searchForm.value.searchInput });
    this.applyFilter();
  }

  filterByAuthor(author: string) {
    this.patchFilter({ author: author });
    this.applyFilter();
  }

  filterByFeed(feed: string) {
    this.patchFilter({ feed: feed });
    this.applyFilter();
  }

  cancelFilters() {
    this.filters = { search: null, author: null, feed: null };
    this.authorForm.reset();
    this.searchForm.reset();
    this.applyFilter();
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    !!node.entry && node.entry.length > 0;
}
