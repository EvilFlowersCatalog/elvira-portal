import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Observable } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from 'src/app/common/components/disposable.component';
import { AppStateService } from 'src/app/common/services/app-state/app-state.service';
import { State } from 'src/app/common/services/app-state/app-state.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DisposableComponent implements OnInit {
  sidebarState$: Observable<boolean>;
  books$: Observable<any>;

  constructor(
    private readonly router: Router,
    private readonly bookService: BookService,
    private readonly appStateService: AppStateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.sidebarState$ = this.appStateService.getState$().pipe(
      takeUntil(this.destroySignal$),
      map((data: State) => data.sidebar)
    );
    this.books$ = this.bookService.getBooks();
  }

  openPdf(id) {
    this.router.navigateByUrl(`/library/pdf-viewer/${id}`);
  }

  private getSelectedText() {
    return (window as any).getSelection().toString();
  }

  public registerSelectionListener() {
    document.addEventListener('selectionchange', (event: any) => {
      const text = this.getSelectedText();

      if (text) {
        console.log(text);
      }
    });
  }
}
