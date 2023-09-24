import { Injectable } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { State } from '../../types/general.types';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private _state$ = new BehaviorSubject<State>(null);
  public state$: Observable<State> = this._state$.asObservable();

  constructor(private localStorageService: LocalStorageService) {
    const defaultState = {
      isLoggedIn: false,
      token: null,
      refresh_token: null,
      username: null,
      userId: null,
      isAdmin: false,
      theme: 'light',
      lang: 'sk',
      sidenav: false,
      count: 0,
    };

    let initState = JSON.parse(localStorage.getItem('state'));

    if (initState === null) {
      initState = defaultState;
    }

    this.setState(initState);
  }

  getState$() {
    return this.state$;
  }

  getStateSnapshot() {
    return this._state$.value;
  }

  setState(newState) {
    this._state$.next(newState);
    this.localStorageService.setItem('state', `${JSON.stringify(newState)}`);
  }

  patchState(newData) {
    const currentState = this._state$.value;
    const newState = { ...currentState, ...newData };
    this._state$.next(newState);
    this.localStorageService.setItem('state', `${JSON.stringify(newState)}`);
  }

  resetState() {
    this._state$.next(null);
    this.localStorageService.clear();
  }

  logoutResetState() {
    this.patchState({
      isLoggedIn: false,
      token: null,
      refresh_token: null,
      username: null,
      userId: null,
      isAdmin: false,
      showSidebarToggle: false,
      sidenav: false,
      count:
        this.getStateSnapshot().count === null ||
        this.getStateSnapshot().count === undefined
          ? 0
          : this.getStateSnapshot().count,
    });
  }
}
