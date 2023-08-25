import { Component, OnInit, HostListener } from '@angular/core';
import { Observable } from 'rxjs';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { EntryService } from 'src/app/services/entry.service';
import { FeedService } from 'src/app/services/feed.service';
import { Entry } from 'src/app/types/entry.types';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  last_added_entries: Entry[]; // used in html
  popular_entries: Entry[]; // used in html
  main_feeds: Feed[]; // used in html
  screen_width: number; // used in html

  constructor(
    private readonly entryService: EntryService,
    private readonly feedService: FeedService,
  ) { super() }

  // For html component in popupal entries -> only shows when screen is < 599
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.screen_width = window.innerWidth;
  }

  ngOnInit(): void {
    // Get last added entries
    this.entryService.getEntriesList({
      page: 0,
      limit: 10,
      order_by: "-created_at"
    })
      .subscribe((data) => {
        this.last_added_entries = data.items
      });
    // Get top most popular entries
    this.entryService.getEntriesList({
      page: 0,
      limit: 5,
      order_by: "-popularity"
    })
      .subscribe((data) => {
        this.popular_entries = data.items
      });

    // Get main feeds
    this.feedService.getFeedsList({
      page: 0,
      limit: 4,
      parent_id: "null" // query for main feeds (has no parent)
    }).subscribe((data) => this.main_feeds = data.items);
  }
}
