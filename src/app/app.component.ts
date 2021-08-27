import { DOCUMENT } from '@angular/common';
import { Component, Inject, Renderer2 } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';
import { DisposableComponent } from './common/components/disposable.component';
import { AppStateService } from './common/services/app-state/app-state.service';
import { State } from './common/services/app-state/app-state.types';
import { TranslocoService } from '@ngneat/transloco';
import { LoadingService } from './common/services/loading/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends DisposableComponent {
  background: string;
  sidenavState: boolean;
  windowStoreChange$: Observable<any>;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private readonly appStateService: AppStateService,
    private readonly langService: TranslocoService,
    private readonly loadingService: LoadingService
  ) {
    super();
  }

  ngOnInit() {
    this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data: State) => {
        this.sidenavState = data.sidenav;
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
    this.initWindowStorageListener();
  }

  setTheme(theme: string) {
    const hostClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
    this.background =
      theme === 'dark' ? 'app-background-dark' : 'app-background-light';
    this.renderer.setAttribute(this.document.body, 'class', hostClass);
  }

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
