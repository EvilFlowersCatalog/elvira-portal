import { Component, OnInit } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { AnnotationFactory } from 'annotpdf';

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {
  filePathAndName = null;
  originalFile = null;
  annotatedFile = null;
  annotations = null;

  constructor(
    private readonly bookService: BookService,
    private readonly route: ActivatedRoute,
  ) {
    pdfDefaultOptions.assetsFolder = 'assets';
  }

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id')
    this.bookService.getBook(bookId).subscribe(data => this.originalFile = data.file)
    this.annotatedFile = this.originalFile
  }

  highlightAnnotation() {

  }

  commentAnnotation() {
    AnnotationFactory.loadFile(this.annotatedFile).then((factory) => {
      factory.createTextAnnotation({
        page: 0,
        rect: [50, 50, 80, 80],
        contents: "Pop up note",
        author: "Max"
      })
      factory.save()
    })
  }

  undoAnnotation() {

  }

  redoAnnotation() {

  }
}

