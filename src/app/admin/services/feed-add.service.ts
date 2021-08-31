import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { addNewFeed, AllFeedsItems } from './admin.types';


@Injectable({
  providedIn: 'root',
})
export class FeedAddService {

  public addFeedSubject = new Subject<AllFeedsItems>();
  public deleteFeedSubject = new Subject<string>();

  passValue(data) {
    //passing the data as the next observable
    const feedData: AllFeedsItems = {
      id: "368c22c0-6202-40da-8c1e-335709b51b1c",
      catalog_id: "95e2b439-4851-4080-b33e-0adc1fd90196",
      parent_id: null,
      creator_id: "7349e877-7ec4-4523-9c4a-5c24648b400f",
      title: data,
      kind: "navigation",
      url_name: data,
      url: "http://127.0.0.1:8000/opds/magical/subsections/fasssaz.xml",
      content: "Some popular shit over there",
      per_page: null,
      created_at: "2021-08-19T09:56:44.265Z",
      updated_at: "2021-08-19T09:56:44.265Z"
    }
    this.addFeedSubject.next(feedData);
  }

  deleteValue(data) {
    this.deleteFeedSubject.next(data);
  }
}

