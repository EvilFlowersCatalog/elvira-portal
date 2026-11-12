import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import useEntrySuggest from "../../hooks/api/entries/useEntrySuggest";
import { setAuthorParams } from "../../hooks/api/entries/entryFilters";
import Thumbnail from "../items/entry/Thumbnail";
import Highlight from "../items/entry/Highlight";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import { addCategoryId, addFeedId } from "../../utils/func/filterParams";
import { localize } from '../../utils/func/localized';
import usePassageSearch from "../../hooks/api/entries/usePassageSearch";
import PassageHits from "../items/entry/PassageHits";

interface SearchSuggestionsProps {
  searchQuery: string;
  onClose: () => void;
  shouldRedirect?: boolean;
}

const Count = ({ count }: { count: number }) => (
  <span className="ml-1 text-[11px] font-normal opacity-60">({count})</span>
);

const SearchSuggestions = ({ searchQuery, onClose, shouldRedirect = false }: SearchSuggestionsProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const debouncedQuery = useDebouncedValue(searchQuery, 250);
  const enabled = !!debouncedQuery && debouncedQuery.trim().length >= 2;
  // One request per debounced keystroke: `/entries/suggest` returns the books and
  // the matching authors, categories and collections (with counts) together. A
  // stale request is aborted; `keepPreviousData` keeps the last suggestions on
  // screen while the next ones load, so the panel updates in place.
  const { data, isFetching, isPlaceholderData } = useEntrySuggest(debouncedQuery.trim(), { enabled });
  // Search inside books: its own request, so the book suggestions don't wait for it.
  const { data: passageData } = usePassageSearch(debouncedQuery.trim(), { enabled, limit: 3, perEntry: 1 });
  const passageHits = passageData?.items ?? [];

  const entries = data?.entries ?? [];
  const authors = data?.authors ?? [];
  const categories = data?.categories ?? [];
  const feeds = data?.feeds ?? [];

  // Only show the skeleton on the very first fetch (nothing cached to show yet).
  const showInitialLoading = isFetching && !data;
  // Background refresh while previous suggestions stay on screen.
  const isRefreshing = isFetching && isPlaceholderData;

  const handleBookClick = (entryId: string, catalogId: string) => {
    searchParams.set('entry-detail-id', entryId);
    searchParams.set('entry-catalog-id', catalogId);
    setSearchParams(searchParams);
    onClose();
  };

  // Apply a picked facet: stay on the page when the grid is already here,
  // otherwise carry the params over to the library.
  const commit = (params: URLSearchParams) => {
    if (shouldRedirect) {
      navigate({ pathname: NAVIGATION_PATHS.library, search: params.toString() });
    } else {
      setSearchParams(params);
    }
    onClose();
  };

  // Commit a free-text search to the full library grid (relevance-ranked
  // `query`). This is the "see all results" affordance — same as pressing Enter.
  const searchFor = (query: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('query', query.trim());
    params.delete('entry-detail-id');
    commit(params);
  };

  const handleAuthorClick = (author: { id: string; name: string; surname: string }) => {
    const params = new URLSearchParams(searchParams);
    setAuthorParams(params, { id: author.id, name: `${author.name} ${author.surname}`.trim() });
    commit(params);
  };

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    addCategoryId(params, categoryId);
    commit(params);
  };

  const handleFeedClick = (feedId: string) => {
    const params = new URLSearchParams(searchParams);
    addFeedId(params, feedId);
    commit(params);
  };

  const hasFacets = authors.length > 0 || categories.length > 0 || feeds.length > 0;
  const hasResults = entries.length > 0 || hasFacets || passageHits.length > 0;
  const didYouMean = data?.did_you_mean;

  if (!searchQuery || searchQuery.trim().length < 2) {
    return null;
  }

  return (
    <div
      // Keep focus on the input so its blur handler doesn't unmount this panel
      // before the click on a suggestion lands.
      onMouseDown={(e) => e.preventDefault()}
      className="absolute top-[70px] left-0 right-0 bg-white dark:bg-darkGray border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-[500px] overflow-auto"
    >
      {/* Thin top progress bar for background refreshes — the previous
          suggestions stay visible underneath instead of a loading wipe. */}
      {isRefreshing && (
        <div className="sticky top-0 left-0 right-0 z-10 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 animate-[loadingbar_1s_ease-in-out_infinite] bg-primary" />
        </div>
      )}

      {didYouMean && (
        <button
          type="button"
          onClick={() => searchFor(didYouMean)}
          className="w-full px-4 pt-3 text-left text-sm text-gray-600 dark:text-gray-300"
        >
          {t('search.didYouMean')}{' '}
          <span className="font-semibold italic text-primaryText dark:text-primaryLight hover:underline">{didYouMean}</span>?
        </button>
      )}

      {showInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <div className="flex-shrink-0 h-16 w-10 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasResults ? (
        <button
          type="button"
          onClick={() => searchFor(searchQuery)}
          className="w-full p-8 text-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primaryLight transition-colors"
        >
          {t('search.noResults', { query: searchQuery.trim() })}
        </button>
      ) : (
        <div className={`grid grid-cols-12 gap-4 transition-opacity duration-150 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
          {/* Books Section - 8 columns, or the full width when there are no facets */}
          <div className={`col-span-12 p-4 ${hasFacets ? 'lg:col-span-8' : ''}`}>
            {entries.length > 0 && (<>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('search.books')}</h3>
              <button
                type="button"
                onClick={() => searchFor(searchQuery)}
                className="text-xs font-medium text-primaryText dark:text-primaryLight hover:underline"
              >
                {t('search.seeAll', { query: searchQuery.trim() })}
              </button>
            </div>
            <div className={`grid md:grid-cols-2 gap-3 ${hasFacets ? '' : 'lg:grid-cols-3'}`}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleBookClick(entry.id, entry.catalog_id)}
                  className="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                >
                  <Thumbnail
                    thumbnail={entry.thumbnail}
                    alt={entry.title}
                    wrapperClassName="flex-shrink-0 h-16 w-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <Highlight
                      as="h4"
                      html={entry.highlight}
                      text={entry.title}
                      className="text-xs font-semibold line-clamp-2 h-8 mb-1 text-secondary dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.authors?.join(', ') || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            </>)}

            {/* Inside books: passages that matched, each opens the viewer at its page */}
            {passageHits.length > 0 && (
              <div className={entries.length > 0 ? 'mt-4' : ''}>
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('search.insideBooks')}</h3>
                <PassageHits hits={passageHits} compact onOpen={onClose} />
              </div>
            )}
          </div>

          {/* Right sidebar - 4 columns */}
          {hasFacets && (
          <div className="col-span-12 lg:col-span-4 flex flex-col px-4 py-1 bg-lightGray dark:bg-strongDarkGray">
            {/* Authors */}
            {authors.length > 0 && (
              <div className="rounded-md p-3">
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('search.authors')}</h3>
                <div className="flex flex-col gap-1">
                  {authors.slice(0, 5).map((author) => (
                    <button
                      key={author.id}
                      onClick={() => handleAuthorClick(author)}
                      className="text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primaryLight transition-colors"
                    >
                      {`${author.name} ${author.surname}`.trim()}
                      <Count count={author.count} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Feeds */}
            {feeds.length > 0 && (
              <div className="rounded-md p-3">
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('search.feeds')}</h3>
                <div className="flex flex-row flex-wrap gap-2">
                  {feeds.map((feed) => (
                    <button
                      key={feed.id}
                      onClick={() => handleFeedClick(feed.id)}
                      className="px-2 py-1 text-xs bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight font-medium transition-colors rounded-md"
                    >
                      {localize(feed.title)}
                      <Count count={feed.count} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="rounded-md p-3">
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('search.categories')}</h3>
                <div className="flex flex-row flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="px-2 py-1 text-xs bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight font-medium transition-colors rounded-md"
                    >
                      {localize(category.label) || category.term}
                      <Count count={category.count} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
