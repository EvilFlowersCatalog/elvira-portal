import { Injectable } from '@angular/core';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root',
})
export class MyShelfCounterService {
  private addedEntries: string[] = [];
  private myShelfCounter: number = 0;

  constructor(private readonly appStateService: AppStateService) {}

  // increment count + add entry id to array
  increment(id: string): void {
    this.addedEntries.push(id);
    this.myShelfCounter++;
    this.appStateService.patchState({ count: this.myShelfCounter }); // patch
  }

  // decrement only if added entries containes given id
  decrement(id: string): void {
    if (this.contains(id)) {
      this.pop(id); // pop
      this.myShelfCounter = Math.max(0, this.myShelfCounter - 1);
      this.appStateService.patchState({ count: this.myShelfCounter }); // patch
    }
  }

  // Reset everything
  resetCounter(): void {
    this.myShelfCounter = 0;
    this.addedEntries = [];
    this.appStateService.patchState({ count: this.myShelfCounter });
  }

  private contains(id: string): boolean {
    let answer: boolean = false;
    const indexToRemove = this.addedEntries.findIndex((_id) => _id === id);

    return indexToRemove === -1 ? false : true;
  }

  private pop(id: string): void {
    const indexToRemove = this.addedEntries.findIndex((_id) => _id === id);

    if (indexToRemove !== -1) {
      // Remove the element at the specified index
      this.addedEntries.splice(indexToRemove, 1);
    }
  }
}
