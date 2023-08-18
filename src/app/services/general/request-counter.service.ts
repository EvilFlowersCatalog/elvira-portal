import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RequestCounterService {
  private requestsCount = 0;

  increment(): void {
    this.requestsCount++;
  }

  decrement(): void {
    this.requestsCount = Math.max(0, this.requestsCount - 1);
  }

  getCount(): number {
    return this.requestsCount;
  }
}