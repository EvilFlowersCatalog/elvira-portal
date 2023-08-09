import { Component, OnInit, HostListener } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntriesItem, EntriesParams, FeedTreeNode, ListEntriesResponse } from '../../types/library.types';
import { concatMap, startWith, takeUntil } from 'rxjs/operators';
import { EntriesService } from '../../services/entries.service';
import { FeedsService } from '../../services/feeds.service';

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
  ) { super() }
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.entriesService.getEntries(0, 10, null, null)
    .subscribe((data) => {

      this.lastAddedEntries = data.items.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      this.popularEntries = data.items.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 5);
    });
    
    this.feedsService.getFeeds(100, null, null)
    .subscribe((data) => {
      this.mainFeeds = data.items.filter((item) => {
        return item.parents.length === 0;
      })
    });

  }
}
