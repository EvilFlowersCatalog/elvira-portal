import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { IEntry } from '../utils/interfaces/entry';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';

/** What opening needs of a publication: a list item or a detail both carry it. */
type Openable = Pick<IEntry, 'config' | 'catalog_id'> & { acquisitions: { mime: string }[] };

/** Index of the PDF the viewer can open at a page, or -1 (no PDF, or lent through Readium LCP). */
export const readablePdfIndex = (entry: Pick<Openable, 'acquisitions' | 'config'> | undefined): number => {
  if (!entry || entry.config?.readium_enabled) return -1;
  return entry.acquisitions?.findIndex((a) => a.mime === 'application/pdf') ?? -1;
};

/**
 * Open a publication: at a page in the viewer when its PDF can be read directly, else its
 * detail (where borrowing and the other files live). The viewer applies its own access checks.
 */
export default function useOpenPublication() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const openDetail = useCallback(
    (entryId: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('entry-detail-id', entryId);
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const openAt = useCallback(
    (entryId: string, entry: Openable | undefined, page: number | null | undefined) => {
      const index = readablePdfIndex(entry);
      if (index < 0 || !page) {
        openDetail(entryId);
        return;
      }
      navigate(`${NAVIGATION_PATHS.viewer}${entryId}/${index}?page=${page}`, {
        state: { fromPath: `${location.pathname}${location.search}`, catalogId: entry?.catalog_id },
      });
    },
    [navigate, location, openDetail]
  );

  return { openAt, openDetail };
}
