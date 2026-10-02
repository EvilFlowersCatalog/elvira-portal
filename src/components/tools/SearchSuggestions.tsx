import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import useEntriesQuery from "../../hooks/api/entries/useEntriesQuery";
import useFeedsQuery from "../../hooks/api/feeds/useFeedsQuery";
import useGetCategories from "../../hooks/api/categories/useGetCategories";
import Thumbnail from "../items/entry/Thumbnail";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { ICategory } from "../../utils/interfaces/category";
import { IFeed } from "../../utils/interfaces/feed";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";
import { addCategoryId, addFeedId } from "../../utils/func/filterParams";

interface SearchSuggestionsProps {
  searchQuery: string;
  onClose: () => void;
  shouldRedirect?: boolean;
}

const SearchSuggestions = ({ searchQuery, onClose, shouldRedirect = false }: SearchSuggestionsProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const debouncedQuery = useDebouncedValue(searchQuery, 250);
  const enabled = !!debouncedQuery && debouncedQuery.trim().length >= 2;
  // Use the backend's relevance-ranked full-text `query` (matches title, summary,
  // author, publisher and category) instead of the old title-only `title` filter,
  // which missed most matches. `keepPreviousData` (in useEntriesQuery) keeps the
  // last suggestions visible while the next set loads, so the panel updates in
  // place with no flash — the user never sees a loading wipe.
  const { data, isFetching, isPlaceholderData } = useEntriesQuery(
    { query: debouncedQuery, limit: 6 },
    { enabled }
  );

  // Collections / categories are also searched directly by name, so e.g. "history"
  // suggests the History collection even when none of the top books are in it.
  // Same debounce + keepPreviousData behaviour as the books query.
  const { data: feedMatches } = useFeedsQuery(
    { title: debouncedQuery, kind: 'acquisition', page: 1, limit: 6, paginate: true },
    { enabled }
  );
  const getCategories = useGetCategories();
  const { data: categoryMatches } = useQuery({
    queryKey: ['categories', 'suggest', debouncedQuery],
    queryFn: () => getCategories({ query: debouncedQuery, page: 1, limit: 6, paginate: true }),
    enabled,
    placeholderData: keepPreviousData,
  });

  // When the text matched a category / collection by name, also show books from
  // it — otherwise "Fiction" would suggest the category but zero books.
  const categoryIds = (categoryMatches?.items ?? []).map((c) => c.id).join(',');
  const feedIds = (feedMatches?.items ?? []).map((f) => f.id).join(',');
  const { data: categoryBooks } = useEntriesQuery(
    { categories: categoryIds, limit: 6 },
    { enabled: enabled && !!categoryIds }
  );
  const { data: feedBooks } = useEntriesQuery(
    { feeds: feedIds, limit: 6 },
    { enabled: enabled && !!feedIds }
  );

  // Only show the skeleton on the very first fetch (nothing cached to show yet).
  const showInitialLoading = isFetching && !data;
  // Background refresh while previous suggestions stay on screen.
  const isRefreshing = isFetching && isPlaceholderData;

  // Books preview plus author / category / collection facets. Direct name matches
  // come first, then the ones derived from the matching books; each list is
  // de-duplicated and a section with nothing in it is simply not shown.
  const { entries, authors, categories, feeds } = useMemo(() => {
    // Text matches first (most relevant), then books from the matched categories
    // and collections to fill the list; de-duplicated by id.
    const seen = new Set<string>();
    const items = [
      ...(data?.items ?? []),
      ...(categoryIds ? categoryBooks?.items ?? [] : []),
      ...(feedIds ? feedBooks?.items ?? [] : []),
    ].filter((e) => !seen.has(e.id) && seen.add(e.id));
    const uniqueAuthors = new Set<string>();
    const categoriesMap = new Map<string, ICategory>();
    const feedsMap = new Map<string, IFeed>();
    (categoryMatches?.items ?? []).forEach((cat) => categoriesMap.set(cat.id, cat));
    (feedMatches?.items ?? []).forEach((feed) => feedsMap.set(feed.id, feed));
    items.forEach((entry) => {
      entry.authors?.forEach((author) => uniqueAuthors.add(author.name + " " + author.surname));
      entry.categories?.forEach((cat) => {
        if (!categoriesMap.has(cat.id)) categoriesMap.set(cat.id, cat);
      });
      entry.feeds?.forEach((feed) => {
        if (!feedsMap.has(feed.id)) feedsMap.set(feed.id, feed);
      });
    });
    return {
      entries: items.slice(0, 6),
      authors: Array.from(uniqueAuthors).slice(0, 10),
      categories: Array.from(categoriesMap.values()).slice(0, 10),
      feeds: Array.from(feedsMap.values()).slice(0, 10),
    };
  }, [data, feedMatches, categoryMatches, categoryBooks, feedBooks, categoryIds, feedIds]);

  const handleBookClick = (entryId: string) => {
    searchParams.set('entry-detail-id', entryId);
    searchParams.set('entry-catalog-id', entries.find(e => e.id === entryId)?.catalog_id || '');
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

  // Commit the free-text search to the full library grid (relevance-ranked
  // `query`). This is the "see all results" affordance — same as pressing Enter.
  const handleSeeAll = () => {
    const params = new URLSearchParams(searchParams);
    params.set('query', searchQuery.trim());
    params.delete('entry-detail-id');
    commit(params);
  };

  const handleAuthorClick = (authorName: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('author', authorName);
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

  const hasResults = entries.length > 0 || authors.length > 0 || categories.length > 0 || feeds.length > 0;

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
          onClick={handleSeeAll}
          className="w-full p-8 text-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primaryLight transition-colors"
        >
          {t('search.noResults', { query: searchQuery.trim() })}
        </button>
      ) : (
        <div className={`grid grid-cols-12 gap-4 transition-opacity duration-150 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
          {/* Books Section - 8 columns */}
          <div className="col-span-12 lg:col-span-8 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('search.books')}</h3>
              <button
                type="button"
                onClick={handleSeeAll}
                className="text-xs font-medium text-primaryText dark:text-primaryLight hover:underline"
              >
                {t('search.seeAll', { query: searchQuery.trim() })}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleBookClick(entry.id)}
                  className="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                >
                  <Thumbnail
                    thumbnail={entry.thumbnail}
                    alt={entry.title}
                    wrapperClassName="flex-shrink-0 h-16 w-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold line-clamp-2 h-8 mb-1 text-secondary dark:text-white">
                      {entry.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.authors?.map(a => a.name + ' ' + a.surname).join(', ') || '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar - 4 columns */}
          <div className="col-span-12 lg:col-span-4 flex flex-col px-4 py-1 bg-lightGray dark:bg-strongDarkGray">
            {/* Authors */}
            {authors.length > 0 && (
              <div className="rounded-md p-3">
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('search.authors')}</h3>
                <div className="flex flex-col gap-1">
                  {authors.slice(0,5).map((author, index) => (
                    <button
                      key={index}
                      onClick={() => handleAuthorClick(author)}
                      className="text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primaryLight transition-colors"
                    >
                      {author}
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
                      {feed.title}
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
                      {category.label || category.term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
