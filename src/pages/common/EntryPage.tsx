import { useEffect } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RiArrowLeftLine } from 'react-icons/ri';
import EntryDetailContent from '../../components/items/entry/details/EntryDetailContent';
import { entryDetailQuery } from '../../hooks/api/entries/entryQueries';
import { EntryTab, entryPath, isEntryTab } from '@/lib/links/paths';
import useCitationMeta from '../../hooks/useCitationMeta';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { withRememberedSearch } from '../../utils/func/listSearch';

/** Whether the browser history has an in-app page before this one (React Router numbers its entries). */
const hasInAppHistory = () => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;

/**
 * `/entries/:entryId[/:tab]`: a publication as a page of its own. It is the canonical address of a
 * publication: what Copy link gives, what a new tab opens, and where a reader without access lands. It
 * renders the same body as the dialog from the same cache, so moving between the two costs no request.
 */
const EntryPage = () => {
  const { entryId = '', tab: rawTab } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const catalogId = searchParams.get('catalog');
  const tab: EntryTab | null = isEntryTab(rawTab) ? rawTab : null;

  const { data: entry } = useQuery(entryDetailQuery(entryId, catalogId));

  // The tab title names the publication; reference managers read its metadata (no file URL, no token).
  useEffect(() => {
    if (!entry?.title) return;
    const previous = document.title;
    document.title = entry.title;
    return () => {
      document.title = previous;
    };
  }, [entry?.title]);
  useCitationMeta(entry);

  // An unknown tab segment is the publication itself.
  if (rawTab && !tab) return <Navigate to={entryPath(entryId, { catalogId })} replace />;

  // Back where the reader came from; opened from outside (a shared link), the library as it was left.
  const back = () => (hasInAppHistory() ? navigate(-1) : navigate(withRememberedSearch(NAVIGATION_PATHS.library)));

  return (
    <div className="h-full overflow-auto relative">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-strongDarkGray">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1 text-sm text-secondary dark:text-secondaryLight hover:underline"
        >
          <RiArrowLeftLine size={18} />
          {hasInAppHistory() ? t('links.back') : t('links.backToLibrary')}
        </button>
      </div>
      <EntryDetailContent
        key={entryId}
        entryId={entryId}
        catalogId={catalogId}
        tab={tab}
        // Tabs are part of the address (shareable) but not of the history: switching replaces.
        onTabChange={(next) => navigate(entryPath(entryId, { tab: next, catalogId }), { replace: true, preventScrollReset: true })}
        variant="page"
      />
    </div>
  );
};

export default EntryPage;
