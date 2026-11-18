import { QueryClient } from '@tanstack/react-query';
import type { IEntryDetail } from '../../utils/interfaces/entry';
import type { IReaderLoaderBook } from './ReaderLoader';

/** The publication's cover, title and authors for the reader's loading screen, from the cache (no request). */
export const cachedReaderBook = (queryClient: QueryClient, entryId: string): IReaderLoaderBook | null => {
  const entry = queryClient
    .getQueriesData<IEntryDetail>({ queryKey: ['entry-detail'] })
    .map(([, data]) => data)
    .find((data) => data?.id === entryId);
  return entry
    ? {
        title: entry.title,
        authors: entry.authors.map((author) => `${author.name} ${author.surname}`.trim()).join(', '),
        thumbnail: entry.thumbnail,
      }
    : null;
};
