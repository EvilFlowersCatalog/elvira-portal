import { DOCUMENT } from '@angular/common';
import { Component, Inject, Renderer2 } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { DisposableComponent } from './common/components/disposable.component';
import { AppStateService } from './common/services/app-state/app-state.service';
import { State } from './common/services/app-state/app-state.types';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends DisposableComponent {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private readonly appStateService: AppStateService,
    private readonly langService: TranslocoService
  ) {
    super();
  }

  ngOnInit() {
    this.appStateService
      .getState$()
      .pipe(takeUntil(this.destroySignal$))
      .subscribe((data: State) => {this.setTheme(data.theme); this.langService.setActiveLang(data.lang);});
  }

  setTheme(theme: string) {
    const hostClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
    this.renderer.setAttribute(this.document.body, 'class', hostClass);
  }
}
