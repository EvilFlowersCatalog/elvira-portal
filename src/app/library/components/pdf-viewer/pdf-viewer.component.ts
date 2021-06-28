import { Component, OnInit } from '@angular/core';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { AnnotationFactory } from 'annotpdf';
import { fabric } from 'fabric';

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
  private canvas: any;
  private textString: string;
  private size: any = {
    width: 1200,
    height: 1000
  };
  private OutputContent: string;

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

    this.canvas = new fabric.Canvas('canvas', {
      hoverCursor: 'pointer',
      selection: true,
      selectionBorderColor: 'blue'
    });
    this.textString = null;
    this.canvas.setWidth(this.size.width);
    this.canvas.setHeight(this.size.height);
    this.OutputContent = null;
  }

  addFigure() {
    let add: any;

    add = new fabric.Rect({
      width: 200, height: 100, left: 10, top: 10, angle: 0,
      fill: '#3f51b5'
    });

    this.extend(add, this.randomId());
    this.canvas.add(add);
    this.selectItemAfterAdded(add);
  }


  extend(obj, id) {
    obj.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          id: id
        });
      };
    })(obj.toObject);
  }
  //======= this is used to generate random id of every object ===========
  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }
  //== this function is used to active the object after creation ==========
  selectItemAfterAdded(obj) {
    this.canvas.discardActiveObject().renderAll();
    this.canvas.setActiveObject(obj);
  }


  highlightAnnotation() {
    // console.log(document.getElementsByClassName('page')[0].getBoundingClientRect())

    var span = document.createElement("span");
    span.style.backgroundColor = "red";
    span.id = 'kokot'

    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.rangeCount) {
        var range = sel.getRangeAt(0).cloneRange();
        range.surroundContents(span);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
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

