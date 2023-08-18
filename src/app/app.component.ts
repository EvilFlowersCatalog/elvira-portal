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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends DisposableComponent {
  // Variables
  background: string; // used in html
  sidenav_state: boolean; // used in html
  windowStoreChange$: Observable<any>;

  constructor(
    private readonly appStateService: AppStateService,
    private readonly langService: TranslocoService,
    private readonly loadingService: LoadingService,
    private readonly iconLoaderService: IconLoaderService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
    super();
  }

  ngOnInit() {
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
          if (status) {
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
