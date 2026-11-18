import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { config } from '@/lib/config';
import { EntryTab, isEntryTab } from '@/lib/links/paths';

/** History-entry marker: this entry was pushed by opening the dialog in-app, so closing can step back. */
const OPENED_HERE = 'entryDialogOpened';

/**
 * The publication dialog over the current page, driven by the URL (`entry-detail-id`, `entry-catalog-id`,
 * `entry-tab`), so it survives a refresh and opens for whoever the link is sent to. One host renders it
 * for the whole portal (EntryDialogHost in App); everything that opens a publication goes through here.
 *
 * History: opening pushes an entry, so Back closes the dialog. Closing a dialog opened here steps back
 * instead of pushing (Back must not reopen what was just closed); a dialog that came with the URL is
 * closed in place. Switching tabs replaces.
 */
export default function useEntryDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const entryId = searchParams.get('entry-detail-id');
  const catalogId = searchParams.get('entry-catalog-id');
  const rawTab = searchParams.get('entry-tab');
  const tab: EntryTab | null = isEntryTab(rawTab) ? rawTab : null;
  const openedHere = !!(location.state as Record<string, unknown> | null)?.[OPENED_HERE];

  const open = useCallback(
    (id: string, options: { catalogId?: string | null; tab?: EntryTab | null; onTop?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams);
      const replacing = params.has('entry-detail-id');
      params.set('entry-detail-id', id);
      // The portal's own catalog is implied; only another catalog is spelled out.
      if (options.catalogId && options.catalogId !== config.ELVIRA_CATALOG_ID) params.set('entry-catalog-id', options.catalogId);
      else params.delete('entry-catalog-id');
      if (options.tab) params.set('entry-tab', options.tab);
      else params.delete('entry-tab');
      // Above the assistant drawer when opened from it.
      if (options.onTop) params.set('dialog-priority', 'entry-detail');
      // One publication after another (related, chapters) replaces, so Back leaves the dialog in one step.
      setSearchParams(params, {
        preventScrollReset: true,
        replace: replacing,
        state: { [OPENED_HERE]: replacing ? openedHere : true },
      });
    },
    [searchParams, setSearchParams, openedHere],
  );

  const close = useCallback(() => {
    if (openedHere) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(searchParams);
    ['entry-detail-id', 'entry-catalog-id', 'entry-tab'].forEach((key) => params.delete(key));
    if (params.get('dialog-priority') === 'entry-detail') params.delete('dialog-priority');
    setSearchParams(params, { preventScrollReset: true, replace: true });
  }, [openedHere, navigate, searchParams, setSearchParams]);

  const setTab = useCallback(
    (next: EntryTab) => {
      const params = new URLSearchParams(searchParams);
      params.set('entry-tab', next);
      setSearchParams(params, { replace: true, preventScrollReset: true, state: location.state });
    },
    [searchParams, setSearchParams, location.state],
  );

  return { entryId, catalogId, tab, open, close, setTab };
}
