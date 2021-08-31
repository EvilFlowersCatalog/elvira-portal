import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AllEntryItems, EntriesData } from './admin.types';


@Injectable({
  providedIn: 'root',
})
export class DocumentAddService {

  public addDocumentSubject = new Subject<AllEntryItems>();
  public deleteDocumentSubject = new Subject<string>();

  passValue(title, name, surname) {
    //passing the data as the next observable
    const entriesData: AllEntryItems = {
      id: "fbd3bcd6-4c05-46fc-8f03-9cc65b0aasd",
  creator_id: '7349e877-7ec4-4523-9c4a-5c24648b400f',
  catalog_id: '95e2b439-4851-4080-b33e-0adc1fd90196',
  author: {
    id: '749d7f64-ae8b-41da-a9b0-50381ef3eafdhgdfg',
    name: name,
    surname: surname,
  },
  category: {
    id: '5d0deb63-e8ec-47e7-ac1d-a250ef81584d',
    term: 'FIC020000',
  },
  language: {
    id: 'a495371c-0bf3-458e-99c1-5eb8f1721abe',
    name: 'slovak',
    code: 'sk',
  },
  title: title,
  created_at: '2021-08-09T14:11:25.133Z',
  updated_at: '2021-08-09T14:11:25.133Z'
}
console.log(entriesData);
    this.addDocumentSubject.next(entriesData);
  }

  deleteValue(data){
    this.deleteDocumentSubject.next(data);
  }

}
