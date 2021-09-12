import { Inject, Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@ngneat/transloco';

@Injectable()
export class CustomPaginationComponent extends MatPaginatorIntl {
  constructor(private readonly translocoService: TranslocoService) {
    super();
    this.translocoService.langChanges$.subscribe((lang) => {
      this.itemsPerPageLabel = this.translocoService.translate(
        'lazy.paginator.items-per-page'
      );
      this.nextPageLabel = this.translocoService.translate(
        'lazy.paginator.next-page'
      );
      this.previousPageLabel = this.translocoService.translate(
        'lazy.paginator.previous-page'
      );

      if (lang === 'sk') {
        this.getRangeLabel = this.rangeLabelSK;
      }

      if (lang === 'en') {
        this.getRangeLabel = this.rangeLabelEN;
      }

      this.changes.next();
    });
  }

  rangeLabelSK = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) {
      return `Strana 0 z ${length}`;
    }

    length = Math.max(length, 0);

    return `Strana ${page + 1} z ${Math.ceil(length / pageSize)}`;
  };

  rangeLabelEN = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0) {
      return `Page 0 of ${length}`;
    }

    length = Math.max(length, 0);

    return `Page ${page + 1} of ${Math.ceil(length / pageSize)}`;
  };

  getPaginatorIntl(translocoService: TranslocoService) {
    const paginatorIntl = new MatPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = this.translocoService.translate(
      'lazy.paginator.items-per-page'
    );
    paginatorIntl.nextPageLabel = this.translocoService.translate(
      'lazy.paginator.next-page'
    );
    paginatorIntl.previousPageLabel = this.translocoService.translate(
      'lazy.paginator.previous-page'
    );

    if (translocoService.getActiveLang() === 'sk') {
      paginatorIntl.getRangeLabel = this.rangeLabelSK;
    }

    if (translocoService.getActiveLang() === 'en') {
      paginatorIntl.getRangeLabel = this.rangeLabelEN;
    }
    return paginatorIntl;
  }
}
