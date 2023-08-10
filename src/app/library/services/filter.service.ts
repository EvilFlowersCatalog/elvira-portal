import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
    private page: number = 1;
    private limit: number = 15;
    private title: string = "";
    private feed: string = "";
    private changedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    changed$: Observable<boolean> = this.changedSubject.asObservable();

    setPage(page: number) {
        this.page = page + 1;
    }

    setLimit(limit: number) {
        this.limit = limit;
    }

    setTitle(title: string) {
        if (title !== this.title) {
            this.title = title;
            this.changedSubject.next(true);
        } else { this.changedSubject.next(false); }
    }

    setFeed(feed: string) {
        if (feed !== this.feed) {
            this.feed = feed;
            this.changedSubject.next(true);
        } else { this.changedSubject.next(false); }
    }

    getFilter() {
        return {
            params: {
                page: this.page,
                limit: this.limit,
                title: this.title,
                feed_id: this.feed
            }
        };
    }

    getFilterFor10Latest() {
        return {
            params: {
                page: 1,
                limit: 10,
                order_by: "-created_at" 
            }
        }
    }

    getFilterForTop5() {
        return {
            params: {
                page: 1,
                limit: 5,
                order_by: "-popularity"
            }
        }
    }
}