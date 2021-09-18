import { NestedTreeControl } from '@angular/cdk/tree';
import { ElementRef } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
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
  selectedAuthor: string;

  @ViewChild('authorInputNative')
  authorInputNative: ElementRef<HTMLInputElement>;

  constructor(
    private readonly filtersService: FiltersService,
    private readonly appStateService: AppStateService,
    private readonly fb: FormBuilder
  ) {
    super();
    this.filtersService
      .getFeedTreeNode()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data) => {
        this.dataSource.data = data.entry;
      });
  }

  ngOnInit(): void {
    const state = this.appStateService.getStateSnapshot();
    this.searchForm = this.initSearchForm(state?.filters?.search);
    this.authorForm = this.initAuthorForm();
    this.selectedAuthor = state?.filters?.author?.name;

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

  initSearchForm(value: string) {
    const controlValue = value ? value : '';
    return this.fb.group({
      searchInput: [controlValue],
    });
  }

  initAuthorForm() {
    return this.fb.group({
      authorInput: [''],
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

  filterByAuthor(id: string, name: string) {
    this.patchFilter({ author: { id: id, name: name } });
    this.applyFilter();
  }

  onAuthorSelected(event: MatAutocompleteSelectedEvent) {
    const authorId = event.option.value;
    const authorName = event.option.viewValue;
    this.selectedAuthor = authorName;
    this.authorInputNative.nativeElement.value = '';
    this.authorForm.controls.authorInput.setValue(null);
    this.filterByAuthor(authorId, authorName);
  }

  filterByFeed(feed: string) {
    this.patchFilter({ feed: feed });
    this.applyFilter();
  }

  cancelFilters() {
    this.filters = { search: null, author: null, feed: null };
    this.authorForm.reset();
    this.authorInputNative.nativeElement.value = '';
    this.selectedAuthor = null;
    this.searchForm.reset();
    this.applyFilter();
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    node.type === 'navigation';
}
