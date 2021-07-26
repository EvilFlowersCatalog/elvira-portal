import { Directive, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

export interface Disposable {
  /**
   * Destroy signal$ fired when destroying component
   */
  destroySignal$: Subject<unknown>;
}

/**
 * Disposable
 */
@Directive()
export abstract class DisposableComponent implements OnDestroy, Disposable {
  destroySignal$ = new Subject();

  ngOnDestroy() {
    this.destroySignal$.next();
    this.destroySignal$.complete();
  }
}

/**
 * Disposable service
 */
@Injectable()
export abstract class DisposableService implements OnDestroy {
  destroySignal$ = new Subject();

  ngOnDestroy() {
    this.destroySignal$.next();
    this.destroySignal$.complete();
  }
}
