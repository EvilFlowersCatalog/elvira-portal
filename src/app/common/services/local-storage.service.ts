import { Inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE_TOKEN } from '../common.module';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor(@Inject(LOCAL_STORAGE_TOKEN) private localStorage: Storage) { }

  getItem(attribute: string): string {
    return this.localStorage.getItem(attribute)
  }

  setItem(attribute: string, value: string) {
    this.localStorage.setItem(attribute, value)
  }

  removeItem(attribute: string) {
    this.localStorage.removeItem(attribute)
  }

  clear() {
    this.localStorage.clear()
  }
}
