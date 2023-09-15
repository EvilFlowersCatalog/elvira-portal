import { Component, Input } from '@angular/core';
import { NavigationService } from 'src/app/services/general/navigation.service';
import { Feed } from 'src/app/types/feed.types';
import { Filters } from 'src/app/types/general.types';

@Component({
  selector: 'app-feed',
  template: `
    <div
      fxLayout="column"
      fxLayoutAlign="center center"
      (elviraclick)="feedNavigator($event)"
      class="feed-container"
    >
      <mat-icon class="feed-icon"> book </mat-icon>
      <div fxLayoutAlign="center center" fxLayout="column">
        <div class="feed-title">{{ feed.title }}</div>
        <span>{{ feed.content }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .feed-container {
        border: 2px solid transparent;
        text-align: center;
        background-color: #00bcd4;
        height: 100%;
        padding: 5px 10px;
        cursor: pointer;
      }

      .feed-container:hover {
        border: 2px solid;
      }

      .feed-icon {
        width: 50px;
        height: 50px;
        font-size: 50px;
      }

      .feed-title {
        font-size: 20px;
      }

      span {
        font-size: 12px;
      }

      @media screen and (max-width: 959px) {
        .feed-title {
          font-size: 17px;
        }
      }

      @media screen and (max-width: 599px) {
        .feed-title {
          font-size: 15px;
        }
      }
    `,
  ],
})
export class FeedComponent {
  @Input() feed: Feed;

  constructor(private readonly navigationService: NavigationService) {}

  // If the feed's kind is navigation go to /feed/id, else go to library
  feedNavigator(event: any) {
    if (this.feed.kind === 'navigation') {
      this.navigationService.modifiedNavigation(
        `/elvira/feeds/${this.feed.id}`,
        event
      );
    } else {
      this.navigationService.modifiedNavigation(
        `/elvira/library/${new Filters('', '', this.feed.id).getFilters()}`,
        event
      );
    }
  }
}
