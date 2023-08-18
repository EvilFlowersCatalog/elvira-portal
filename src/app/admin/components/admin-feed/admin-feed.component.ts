import { Component, Input, Output, EventEmitter } from '@angular/core'
import { Feed } from 'src/app/types/feed.types';

@Component({
    selector: 'app-admin-feed',
    templateUrl: `./admin-feed.component.html`,
    styleUrls: [`./admin-feed.component.scss`],
})
export class FeedAdminComponent {
    @Input() feed: Feed;
    @Output() editClicked = new EventEmitter<Feed>();
    @Output() deleteClicked = new EventEmitter<Feed>();
    @Output() nextClicked = new EventEmitter<Feed>();

    onEditClick() {
        this.editClicked.emit(this.feed);
    }

    onDeleteClick() {
        this.deleteClicked.emit(this.feed);
    }

    onNextClick() {
        this.nextClicked.emit(this.feed);
    }
}