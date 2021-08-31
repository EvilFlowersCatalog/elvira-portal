import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@ngneat/transloco';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CustomPaginationService {
  constructor(
    private translocoService: TranslocoService
  )
  {}
  rangeLabel = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) { return `0 van ${length}`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex} van ${length}`;
  }

  public getPaginatorIntl() {
    const paginatorIntl = new MatPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = this.translocoService.translate(
      'lazy.entryDetail.drive-success-message'
    );
    paginatorIntl.nextPageLabel = 'Volgende pagina';
    paginatorIntl.previousPageLabel = 'Vorige pagina';
    paginatorIntl.getRangeLabel = this.rangeLabel;

    return paginatorIntl;
  }
}


