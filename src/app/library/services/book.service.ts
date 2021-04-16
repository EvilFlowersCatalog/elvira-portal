import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  public books = [
    {
      id: 0,
      title: "Algebra a diskrétna matematika",
      front: "../../assets/adm_front.jpg",
      file: "../../assets/adm_text.pdf"
    },
    {
      id: 1,
      title: "Matematická logika",
      front: "../../assets/matlog_front.jpg",
      file: "../../assets/matlog_text.pdf"
    },
    {
      id: 2,
      title: "O softvére",
      front: "../../assets/softver_front.jpg",
      file: "../../assets/softver_text.pdf"
    },
    {
      id: 3,
      title: "Umelá inteligencia",
      front: "../../assets/ui_front.gif",
      file: "../../assets/ui_text.pdf"
    },
  ]

  constructor() { }

  getBooks() {
    return of(this.books)
  }

  getBook(id) {
    return of(this.books[id])
  }
}
