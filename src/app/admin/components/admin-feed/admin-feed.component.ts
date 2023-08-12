import { Component, Input, Output, EventEmitter } from '@angular/core'
import { FeedTreeNode } from '../../types/admin.types'
import { Router } from '@angular/router';
import { FilterService } from 'src/app/library/services/filter.service';

@Component({
    selector: 'app-admin-feed',
    templateUrl: `./admin-feed.component.html`,
    styleUrls: [`./admin-feed.component.scss`],
})
export class FeedAdminComponent {
    @Input() feed: FeedTreeNode;
    @Output() editClicked = new EventEmitter<FeedTreeNode>();
    @Output() deleteClicked = new EventEmitter<FeedTreeNode>();
    @Output() nextClicked = new EventEmitter<FeedTreeNode>();

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