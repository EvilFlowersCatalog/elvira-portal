import { NestedTreeControl } from '@angular/cdk/tree';
import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Observable } from 'rxjs';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  pluck,
  takeUntil,
} from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import {
  Filters,
  State,
} from 'src/app/common/services/app-state/app-state.types';
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
  selectedAuthor: string;
  selectedFeed: string;
  appState$: Observable<State>;
  @ViewChild('authorInputNative')
  authorInputNative: ElementRef<HTMLInputElement>;

  constructor(
    private readonly filtersService: FiltersService,
    private readonly appStateService: AppStateService,
    private readonly fb: FormBuilder
  ) {
    super();
  }

  ngOnInit(): void {
    this.searchForm = this.initSearchForm();
    this.authorForm = this.initAuthorForm();

    this.filtersService
      .getFeedTreeNode()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data) => {
        this.dataSource.data = data.entry;
      });

    this.appStateService
      .getState$()
      .pipe(
        takeUntil(this.destroySignal$),
        distinctUntilChanged(),
        pluck('filters')
      )
      .subscribe((filters: Filters) => this.setView(filters));

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

  // forms initialization
  initSearchForm() {
    return this.fb.group({
      searchInput: [''],
    });
  }

  initAuthorForm() {
    return this.fb.group({
      authorInput: [''],
    });
  }

  // setting view of sidebar based on active filter
  setView(filters: Filters) {
    this.searchForm.controls.searchInput.setValue(filters.search);
    this.selectedAuthor = filters.author?.name;
    this.selectedFeed = filters.feed;
    if (!filters.feed) {
      this.treeControl.collapseAll();
    }
  }

  // local fitlers setters
  cancelFilters() {
    this.filters = { search: null, author: null, feed: null };
    this.applyFilters();
  }

  patchFilters(newData) {
    const clearFilters = { search: null, author: null, feed: null };
    const newFilter = { ...clearFilters, ...newData };
    this.filters = newFilter;
  }

  // global filters setter
  applyFilters() {
    this.appStateService.patchState({
      filters: this.filters,
      sidebar: false,
      sidenav: false,
    });
  }

  // filter functions
  search() {
    this.patchFilters({ search: this.searchForm.value.searchInput });
    this.applyFilters();
  }

  filterByAuthor(id: string, name: string) {
    this.patchFilters({ author: { id: id, name: name } });
    this.applyFilters();
  }

  filterByFeed(feed: string) {
    this.patchFilters({ feed: feed });
    this.applyFilters();
  }

  // other
  onAuthorSelected(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value;
    this.authorInputNative.nativeElement.value = '';
    this.authorForm.controls.authorInput.setValue(null);
    this.filterByAuthor(value.id, value.name);
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';
}
