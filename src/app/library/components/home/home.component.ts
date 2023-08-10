import { Component, OnInit, HostListener } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntriesItem, EntriesParams, FeedTreeNode, ListEntriesResponse } from '../../types/library.types';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { EntriesService } from '../../services/entries.service';
import { FeedsService } from '../../services/feeds.service';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  entriesResponse$: Observable<ListEntriesResponse>;
  lastAddedEntries: EntriesItem[];
  popularEntries: EntriesItem[];
  mainFeeds: FeedTreeNode[];
  iconsForMainFeeds: string[] = ["menu_book", "book", "book", "calendar_month"]
  fetchEntries$ = new Subject<EntriesParams>(); 
  fetchFeeds$ = new Subject();
  screenWidth: number;

  constructor(
    private readonly entriesService: EntriesService,
    private readonly feedsService: FeedsService,
    private readonly filterService: FilterService,
  ) { super() }
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.entriesService.getEntries(this.filterService.getFilterFor10Latest())
    .subscribe((data) => {
      this.lastAddedEntries = data.items
    });

    this.entriesService.getEntries(this.filterService.getFilterForTop5())
    .subscribe((data) => {
      this.popularEntries = data.items
    });
    
    this.feedsService.getFeeds({page: 1, limit: 100})
    .subscribe((data) => {
      this.mainFeeds = data.items.filter((item) => {
        return item.parents.length === 0;
      })
    });

  }
}
