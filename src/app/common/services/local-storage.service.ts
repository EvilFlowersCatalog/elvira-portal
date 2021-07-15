import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  getItem(prop: string): string {
    return localStorage.getItem(prop)
  }

  setItem(prop: string, item: string) {
    localStorage.setItem(prop, item)
  }

  removeItem(prop: string) {
    localStorage.removeItem(prop)
  }
}
