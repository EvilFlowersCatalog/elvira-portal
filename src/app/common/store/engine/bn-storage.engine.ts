import { Injectable } from '@angular/core';
import { StorageEngine } from '@ngxs/storage-plugin';

@Injectable()
export class BnStorageEngine implements StorageEngine {
    get length(): number {
        return localStorage.length;
    }

    getItem(key: string): any {
        return localStorage.getItem(key);
    }

    setItem(key: string, value: any): void {
        localStorage.setItem(key, value);
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }

    key(val: number): string {
        return localStorage.key(val);
    }
}
