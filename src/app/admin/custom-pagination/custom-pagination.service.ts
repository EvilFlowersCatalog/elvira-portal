import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@ngneat/transloco';


  const rangeLabelSK = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) { return `0 z ${length}`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex} z ${length}`;
  }

  const rangeLabelEN = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) { return `0 of ${length}`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex} of ${length}`;
  }

  export function getPaginatorIntl(translocoService: TranslocoService) {
    const paginatorIntl = new MatPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = translocoService.translate(
      'lazy.paginator.items-per-page'
    );
    paginatorIntl.nextPageLabel = translocoService.translate(
      'lazy.paginator.next-page'
    );
    paginatorIntl.previousPageLabel = translocoService.translate(
      'lazy.paginator.previous-page'
    );

    if(translocoService.getActiveLang()==='sk'){
      paginatorIntl.getRangeLabel = rangeLabelSK;
    }

    if(translocoService.getActiveLang()==='en'){
      paginatorIntl.getRangeLabel = rangeLabelEN;
    }
    return paginatorIntl;
  }



