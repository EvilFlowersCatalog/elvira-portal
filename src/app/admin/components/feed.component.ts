import { Component, Input } from '@angular/core'
import { FeedTreeNode } from '../types/admin.types'
import { Router } from '@angular/router';
import { FilterService } from 'src/app/library/services/filter.service';

@Component({
    selector: 'app-admin-feed',
    template: `
    <div class="feed-container" (click)="feedNavigator()">
        <mat-icon> book </mat-icon>
        <div>{{ feed.title }}</div>
        <p>{{ feed.content }}</p>
    </div>
    `,
    styles: [`
    .feed-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 10px;
        background-color: #00bcd4;
        height: 100%;
        cursor: pointer;
    }

    .feed-container div {
        font-size: 30px;
    }

    .feed-container mat-icon {
        font-size: 80px;
        height: 80px;
        width: 80px;
    }

    p {
        font-size: 12px
    }

    @media screen and (max-width: 1250px) {
        .feed-container mat-icon {
            font-size: 70px;
            height: 70px;
            width: 70px;
        }
    }

    @media screen and (max-width: 959px) {
        .feed-container div {
            font-size: 18px;
        }
    }

    @media screen and (max-width: 599px) {
        .feed-container div {
            font-size: 15px;
        }

        .feed-container mat-icon {
            font-size: 50px;
            height: 50px;
            width: 50px;
        }
    }
    `],
})
export class FeedAdminComponent {
 
    @Input() feed: FeedTreeNode;

    constructor (
        private readonly router: Router,
        private readonly filterService: FilterService,
    ) {}

    feedNavigator() {
        // if(this.feed.kind === 'navigation') {
        //     this.router.navigateByUrl(`/library/feeds/${this.feed.id}`);
        // }
        // else {
        //     this.filterService.setFeed(this.feed.id)
        //     this.router.navigateByUrl(`/library/all-entries`);
        // }
    }

}