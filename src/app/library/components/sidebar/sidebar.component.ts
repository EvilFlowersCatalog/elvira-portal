import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { Filters } from 'src/app/common/services/app-state/app-state.types';
import { Author, Authors, FeedTreeNode } from '../../library.types';
import { FiltersService } from '../../services/filters/filters.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
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
    this.searchForm = new FormGroup({ searchInput: new FormControl('') });
    this.filtersService.getFeedTreeNode().subscribe((data) => {
      this.dataSource.data = data.entry;
    });
  }

  ngOnInit(): void {
    this.initAuthorForm();
    this.searchAuthors('');

    // this.authorInput.valueChanges
    //   .pipe(
    //     startWith(''),
    //     debounceTime(300),
    //     switchMap((val) => this.filtersService.getAuthorSuggestions(val || ''))
    //   )
    //   .subscribe((authors) => (this.authorSuggestions = authors.items));
  }

  initAuthorForm() {
    this.authorForm = this.fb.group({
      authorInput: [''],
    });
    this.authorForm.get('authorInput').valueChanges.subscribe((response) => {
      console.log('data:', response);
      this.filterAuthorData(response);
    });
  }

  filterAuthorData(enteredData) {}

  patchFilter(newData) {
    const clearFilters = { search: null, author: null, feed: null };
    const newFilter = { ...clearFilters, ...newData };
    this.filters = newFilter;
  }

  search() {
    this.patchFilter({ search: this.searchForm.value.searchInput });
    this.appStateService.patchState({ filters: this.filters });
  }

  searchAuthors(query: string) {
    this.filtersService
      .getAuthorSuggestions(query)
      .subscribe((data: Authors) => {
        this.authorSuggestions = data.items;
      });
  }

  filterByAuthor(author: string) {
    this.patchFilter({ author: author });
    this.appStateService.patchState({ filters: this.filters });
  }

  filterByFeed(feed: string) {
    this.patchFilter({ feed: feed });
    this.appStateService.patchState({ filters: this.filters });
  }

  isNavigationNode = (_: number, node: FeedTreeNode) =>
    !!node.entry && node.entry.length > 0;

  cancelFilters() {
    this.filters = { search: null, author: null, feed: null };
    this.appStateService.patchState({ filters: this.filters });
  }
}
