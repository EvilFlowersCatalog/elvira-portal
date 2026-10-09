import { formatDate } from 'date-fns';

/** One date format for every admin table, independent of the browser locale. */
export const fmtDate = (value?: string | null): string | null =>
  value ? formatDate(new Date(value), 'dd.MM.yyyy') : null;

export const fmtDateTime = (value?: string | null): string | null =>
  value ? formatDate(new Date(value), 'dd.MM.yyyy HH:mm') : null;
