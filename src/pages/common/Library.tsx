import useGetEntries from '../../hooks/api/entries/useGetEntries';
import { useEntryFilters } from '../../hooks/api/entries/entryFilters';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import ItemContainer from '../../components/items/container/ItemContainer';
import EntryBoxLoading from '../../components/items/entry/EntryBoxLoading';
import EntryItem from '../../components/items/entry/display/EntryItem';
import EntriesWrapper from '../../components/items/entry/display/EntriesWrapper';
import { useTranslation } from 'react-i18next';
import FilterSuggestions from '../../components/tools/FilterSuggestions';
import useInfiniteItemContainer from '../../hooks/api/useInfiniteItemContainer';
import usePassageSearch from '../../hooks/api/entries/usePassageSearch';
import FigureResults from '../../components/items/entry/FigureResults';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useFeature } from '../../features/features';
import { useEffect, useRef } from 'react';
import { trackSearchResult } from '../../lib/analytics';

/** URL param of the active results tab; absent = publications. */
export const RESULTS_TAB_PARAM = 'results';

const Library = () => {
  const { t } = useTranslation();
  const { umamiTrack } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const getEntries = useGetEntries();
  const filters = useEntryFilters();

  // The first page carries the facet counts (`include=facets`), so the grid, the
  // sidebar and the suggestion chips come from one request.
  const list = useInfiniteItemContainer<IEntry>(
    ['entries-infinite', filters],
    (page, signal) =>
      getEntries({ page, limit: 30, ...filters, include: page === 1 ? 'facets' : undefined }, signal),
    { withFacets: true }
  );

  // Search inside books, scoped by the same filters (ordering doesn't apply).
  const query = (searchParams.get('query') ?? '').trim();

  // `search.result` in Faro (#59): did a search find anything? A bucket per search, never the query.
  const reportedSearch = useRef<string | null>(null);
  const searchKey = query ? JSON.stringify(filters) : null;
  const firstPageReady = !list.isLoading && !list.isFetching && !list.isError && list.page >= 1;
  useEffect(() => {
    if (!searchKey || !firstPageReady || reportedSearch.current === searchKey) return;
    reportedSearch.current = searchKey;
    // A second page means more than one page of 30, so the bucket is `>10` without counting.
    trackSearchResult(list.maxPage > 1 ? Infinity : list.items.length);
  }, [searchKey, firstPageReady, list.maxPage, list.items.length]);
  const passageFilters = { ...filters, orderBy: '', query: '' };
  // Both need the extraction index, which a minimal instance (KU) does not have: Administration › Features.
  const passagesOn = useFeature('passageSearch');
  const insightsOn = useFeature('contentInsights');
  const passages = usePassageSearch(query, { enabled: passagesOn, limit: 6, perEntry: 3, filters: passageFilters });

  // Figures and tables across the library (#45).
  const figuresTab = insightsOn && query.length >= 2;
  const showFigures = figuresTab && searchParams.get(RESULTS_TAB_PARAM) === 'figures';

  const selectTab = (tab: 'entries' | 'figures') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'figures') params.set(RESULTS_TAB_PARAM, 'figures');
    else params.delete(RESULTS_TAB_PARAM);
    setSearchParams(params);
    umamiTrack('Search Results Tab', { tab });
  };

  const tabs = figuresTab ? (
    <div role="tablist" aria-label={t('search.tabs.label')} className="mx-4 mb-4 flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
      {(['entries', 'figures'] as const).map((tab) => {
        const active = (tab === 'figures') === showFigures;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => selectTab(tab)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              active
                ? 'border-primary text-primary dark:text-primaryLight'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            {t(`search.tabs.${tab}`)}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <ItemContainer
      list={list}
      showLayout
      searchSpecifier="query"
      title={t('navbarMenu.library')}
      tabs={tabs}
      panel={showFigures ? <FigureResults query={query} filters={passageFilters} /> : undefined}
    >
      {!list.isLoading && list.items.length > 0 && searchParams.get('query') && (
        <FilterSuggestions
          searchQuery={searchParams.get('query') || ''}
          facets={list.facets?.data}
          passageHits={passages.data?.items}
          passagesLoading={passages.isLoading}
          showPassages={passagesOn && !!query}
        />
      )}
      <EntriesWrapper>
        {list.items.map((entry) => (
          <EntryItem key={entry.id} entry={entry} />
        ))}
        {list.loadingNext &&
          Array.from({ length: 30 }).map((_, index) => <EntryBoxLoading key={index} fixedSize />)}
      </EntriesWrapper>
    </ItemContainer>
  );
};

export default Library;
