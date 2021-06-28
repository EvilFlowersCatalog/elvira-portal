import { Component, OnInit } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute } from '@angular/router';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {
  filePathAndName = null;
  book = null;

  constructor(
    private readonly bookService: BookService,
    private readonly route: ActivatedRoute,
  ) {
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id')
    this.bookService.getBook(bookId).subscribe(data => this.book = data.file)
  }
}

