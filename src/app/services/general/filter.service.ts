import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private page: number = 0;
  private limit: number = 15;
  private title: string = "";
  private author_name: string = "";
  private created_at: string = "";
  private feed: string = "";
  // For updating in library page (all-entries component)
  private changedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  changed$: Observable<boolean> = this.changedSubject.asObservable();

  // SETTERS
  setPage(page: number) {
    this.page = page;
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

  // GETTERS
  getTitle() { return this.title; }
  getAuthor() { return this.author_name; }
  getCreatedAt() { return this.created_at; }

  // If there are any filters
  getActivity(): boolean {
    if (this.author_name || this.title || this.created_at || this.feed) {
      return true;
    }
    return false;
  }

  // Query for actuall fitler
  getFilter() {
    return {
      page: this.page,
      limit: this.limit,
      title: this.title,
      feed_id: this.feed
    };
  }

  // Query for 10 last added entries
  get10LastAdded() {
    return {
      page: 0,
      limit: 10,
      order_by: "-created_at" // '-' for DESC
    }
  }

  // Query for TOP 5 viewed entries
  getTop5() {
    return {
      page: 0,
      limit: 5,
      order_by: "-popularity"
    }
  }
}