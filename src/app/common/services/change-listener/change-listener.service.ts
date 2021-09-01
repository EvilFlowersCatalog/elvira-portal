import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChangeListenerService {
  public changed$ = new Subject();

  constructor() {}

  statusChanged() {
    this.changed$.next();
  }

  listenToChange() {
    return this.changed$;
  }
}
