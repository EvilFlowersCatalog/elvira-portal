import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IEntry } from '../utils/interfaces/entry';
import { readerPath } from '@/lib/links/paths';
import useEntryDialog from './useEntryDialog';

/** What opening needs of a publication: a list item or a detail both carry it. */
type Openable = Pick<IEntry, 'config' | 'catalog_id'> & { acquisitions: { mime: string }[] };

/** Index of the PDF the viewer can open at a page, or -1 (no PDF, or lent through Readium LCP). */
export const readablePdfIndex = (entry: Pick<Openable, 'acquisitions' | 'config'> | undefined): number => {
  if (!entry || entry.config?.readium_enabled) return -1;
  return entry.acquisitions?.findIndex((a) => a.mime === 'application/pdf') ?? -1;
};

/**
 * Open a publication: at a page in the reader when its PDF can be read directly, else its dialog (where
 * borrowing and the other files live). The reader route applies its own access checks.
 */
export default function useOpenPublication() {
  const navigate = useNavigate();
  const dialog = useEntryDialog();

  const openDetail = useCallback((entryId: string, catalogId?: string | null) => dialog.open(entryId, { catalogId }), [dialog]);

  const openAt = useCallback(
    (entryId: string, entry: Openable | undefined, page: number | null | undefined) => {
      if (readablePdfIndex(entry) < 0 || !page) {
        openDetail(entryId, entry?.catalog_id);
        return;
      }
      navigate(readerPath(entryId, { page, catalogId: entry?.catalog_id }));
    },
    [navigate, openDetail],
  );

  return { openAt, openDetail };
}
