import { Component, Input, Output, EventEmitter } from '@angular/core'
import { Router } from '@angular/router';
import { FilterService } from 'src/app/services/general/filter.service';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { Feed } from 'src/app/types/feed.types';

@Component({
  selector: 'app-feed',
  template: `
    <div class="feed-container" fxLayout="row" fxLayoutAlign="center center" (click)="feedNavigator($event)">
      <mat-icon> book </mat-icon>
      <div class="feed-info-container">
        <div>{{ feed.title }}</div>
        <p>{{ feed.content }}</p>
      </div>
    </div>
    `,
  styles: [`
    .feed-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background-color: #00bcd4;
      height: 100%;
      padding: 10px;
      cursor: pointer;
    }

    .feed-info-container {
      flex: 3;
      align-items: center;
      justify-content: center;
    }

    .feed-info-container div {
      font-size: 30px;
    }

    .feed-container mat-icon {
      flex: 1;
      font-size: 50px;
      height: 50px;
      width: 50px;
    }

    p {
      font-size: 12px
    }

    @media screen and (max-width: 959px) {
      .feed-info-container div {
        font-size: 18px;
      }
    }

    @media screen and (max-width: 599px) {
      .feed-info-container div {
        font-size: 15px;
      }
    }
  `],
})
export class FeedComponent {
  @Input() feed: Feed;

  constructor(
    private readonly navigationService: NavigationService,
    private readonly filterService: FilterService,
  ) { }

  // If the feed's kind is navigation go to /feed/id, else go to library
  feedNavigator($event: PointerEvent) {
    if (this.feed.kind === 'navigation') {
      this.navigationService.modifiedNavigation(`/elvira/feeds/${this.feed.id}`, $event);
    }
    else {
      this.filterService.setFeed(this.feed.id); // set feed to filter
      this.navigationService.modifiedNavigation(`/elvira/library`, $event);
    }
  }

}