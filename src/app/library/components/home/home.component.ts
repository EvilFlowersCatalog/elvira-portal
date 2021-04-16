import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly bookService: BookService
  ) { }

  books$: Observable<any>

  ngOnInit(): void {
    this.books$ = this.bookService.getBooks()
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login'])
  }

  openPdf(id) {
    this.router.navigateByUrl(`/library/pdf-viewer/${id}`)
  }
}
