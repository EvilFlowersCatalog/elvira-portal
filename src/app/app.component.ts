import { DOCUMENT } from '@angular/common';
import { Component, Inject, Renderer2 } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from './common/components/disposable.component';
import { TranslocoService } from '@ngneat/transloco';
import { AppStateService } from './services/general/app-state.service';
import { LoadingService } from './services/general/loading.service';
import { IconLoaderService } from './services/general/icon-loader.service';
import { State } from './types/general.types';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends DisposableComponent {
  // Variables
  background: string; // used in html
  visibility: string; // used in html
  pdfViewer: boolean; // used in html
  sidenav_state: boolean; // used in html
  windowStoreChange$: Observable<any>;

  constructor(
    private readonly appStateService: AppStateService,
    private readonly langService: TranslocoService,
    private readonly loadingService: LoadingService,
    private readonly iconLoaderService: IconLoaderService,
    private readonly router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    super();
  }

  ngOnInit() {
    // If we are at pdf-viewer hide footer
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.toString().includes("/elvira/pdf-viewer/")) {
          this.visibility = 'hide';
          this.pdfViewer = true;
        } else { // else visible
          this.visibility = 'visible';
          this.pdfViewer = false;
        }
      }
    });

    this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data: State) => {
        this.sidenav_state = data.sidenav;
        this.setTheme(data.theme);
        this.langService.setActiveLang(data.lang);
      });
    this.loadingService.loadingStatus$
      .pipe(
        tap((status) => {
          if (status && !this.pdfViewer) { // not for pdfViewer, described in pdf-viewer
            this.loadingService.onShowLoading();
          } else {
            this.loadingService.onHideLoading();
          }
        }),
        takeUntil(this.destroySignal$)
      )
      .subscribe();
    this.iconLoaderService.loadIcons();
    this.initWindowStorageListener();
  }

  // Set themes dark/light
  setTheme(theme: string) {
    const hostClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
    this.background = theme === 'dark' ? 'app-background-dark' : 'app-background-light';
    this.renderer.setAttribute(this.document.body, 'class', hostClass);
  }

  // local storage
  initWindowStorageListener() {
    this.windowStoreChange$ = fromEvent(window, 'storage').pipe(
      takeUntil(this.destroySignal$),
      debounceTime(500)
    );
    this.windowStoreChange$.subscribe((state: StorageEvent) => {
      if (document.hasFocus()) {
        return;
      }
      this.appStateService.setState(JSON.parse(state.newValue));
    });
  }
}
