import { Injectable } from '@angular/core';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root',
})
export class FavoriteCounterService {
  private addedEntries: string[] = [];
  private favoriteCounter: number = 0;

  constructor(private readonly appStateService: AppStateService) {}

  // increment count + add entry id to array
  increment(id: string): void {
    this.addedEntries.push(id);
    this.favoriteCounter++;
    this.appStateService.patchState({ count: this.favoriteCounter }); // patch
  }

  // decrement only if added entries containes given id
  decrement(id: string): void {
    if (this.contains(id)) {
      this.pop(id); // pop
      this.favoriteCounter = Math.max(0, this.favoriteCounter - 1);
      this.appStateService.patchState({ count: this.favoriteCounter }); // patch
    }
  }

  // Reset everything
  resetCounter(): void {
    this.favoriteCounter = 0;
    this.addedEntries = [];
    this.appStateService.patchState({ count: this.favoriteCounter });
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
