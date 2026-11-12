import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { IEntryFacets } from "../../utils/interfaces/entry";
import { addCategoryId, addFeedId, readCategoryIds, readFeedIds } from "../../utils/func/filterParams";
import { AUTHOR_ID_PARAM, setAuthorParams } from "../../hooks/api/entries/entryFilters";
import { localize } from '../../utils/func/localized';
import { IPassageHit } from "../../hooks/api/entries/usePassageSearch";
import PassageHits from "../items/entry/PassageHits";

interface FilterSuggestionsProps {
  searchQuery: string;
  /** Facet counts that came with the search results (`include=facets`). */
  facets?: IEntryFacets | null;
  /** Search inside books (#35): passages that matched, shown as a column of their own. */
  passageHits?: IPassageHit[];
}

type Chip = { id: string; label: string; count: number };

const byCount = (a: Chip, b: Chip) => b.count - a.count;

/**
 * Authors, collections and categories of the current search results, with counts,
 * as one-click refinements. Read from the facets the results came with — no
 * request of its own. The catalog returns the top 10 authors; categories and
 * collections are complete and sorted by count here.
 */
const FilterSuggestions = ({ searchQuery, facets, passageHits = [] }: FilterSuggestionsProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const MAX_ITEMS_PER_COLUMN = 3;

  // Refinements already applied aren't suggested again.
  const activeAuthor = searchParams.get(AUTHOR_ID_PARAM);
  const activeCategories = readCategoryIds(searchParams);
  const activeFeeds = readFeedIds(searchParams);

  const { authors, categories, feeds } = useMemo(() => {
    const authors: Chip[] = (facets?.authors ?? [])
      .filter((a) => a.count > 0 && a.id !== activeAuthor)
      .map((a) => ({ id: a.id, label: `${a.name ?? ''} ${a.surname ?? ''}`.trim(), count: a.count }))
      .filter((a) => a.label)
      .sort(byCount);
    const categories: Chip[] = (facets?.categories ?? [])
      .filter((c) => c.count > 0 && !activeCategories.includes(c.id))
      .map((c) => ({ id: c.id, label: localize(c.label) || c.term || '', count: c.count }))
      .filter((c) => c.label)
      .sort(byCount);
    const feeds: Chip[] = (facets?.feeds ?? [])
      .filter((f) => f.count > 0 && !activeFeeds.includes(f.id))
      .map((f) => ({ id: f.id, label: localize(f.title), count: f.count }))
      .filter((f) => f.label)
      .sort(byCount);
    return { authors, categories, feeds };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facets, activeAuthor, activeCategories.join(','), activeFeeds.join(',')]);

  // Reset visibility / show-all whenever the search term changes.
  useEffect(() => {
    setIsVisible(true);
    setShowAll(false);
  }, [searchQuery]);

  const handleAuthorClick = (author: Chip) => {
    const params = new URLSearchParams(searchParams);
    setAuthorParams(params, { id: author.id, name: author.label });
    setSearchParams(params);
  };

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    addCategoryId(params, categoryId);
    setSearchParams(params);
  };

  const handleFeedClick = (feedId: string) => {
    const params = new URLSearchParams(searchParams);
    addFeedId(params, feedId);
    setSearchParams(params);
  };

  const hasResults = authors.length > 0 || categories.length > 0 || feeds.length > 0 || passageHits.length > 0;
  const hasPassages = passageHits.length > 0;

  const getVisibleItems = <T,>(items: T[]): T[] => {
    return showAll ? items : items.slice(0, MAX_ITEMS_PER_COLUMN);
  };

  const getRemainingCount = (items: unknown[]): number => {
    return Math.max(0, items.length - MAX_ITEMS_PER_COLUMN);
  };

  if (!searchQuery || searchQuery.trim().length < 2 || !isVisible || !hasResults) {
    return null;
  }

  const count = (n: number) => <span className="ml-1 text-xs opacity-60">({n})</span>;

  const column = (title: string, items: Chip[], onClick: (item: Chip) => void, asText = false) => (
    <div className="flex flex-col">
      <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">{title}</h3>
      {items.length > 0 ? (
        <>
          <div className={asText ? "flex flex-col gap-2" : "flex flex-row flex-wrap gap-2"}>
            {getVisibleItems(items).map((item) => (
              <button
                key={item.id}
                onClick={() => onClick(item)}
                className={asText
                  ? "text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primaryLight transition-colors px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  : "text-left px-3 py-1.5 text-sm bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight hover:opacity-80 transition-opacity rounded-md"}
              >
                {item.label}
                {count(item.count)}
              </button>
            ))}
          </div>
          {!showAll && getRemainingCount(items) > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-left text-sm text-primary dark:text-primaryLight hover:underline mt-3 font-semibold"
            >
              {t('common.showMore', { count: getRemainingCount(items) })}
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('page.noResults')}</p>
      )}
    </div>
  );

  return (
    <div className="w-full px-4 mb-6">
      <div className="relative bg-white dark:bg-darkGray border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-4">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label={t('common.close')}
        >
          <MdClose size={20} className="text-gray-500 dark:text-gray-400" />
        </button>

        <div className={`grid grid-cols-1 gap-6 pr-8 ${hasPassages ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          {column(t('entry.wizard.authors'), authors, handleAuthorClick, true)}
          {column(t('searchBar.feeds'), feeds, (f) => handleFeedClick(f.id))}
          {column(t('searchBar.categories'), categories, (c) => handleCategoryClick(c.id))}
          {hasPassages && (
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">{t('search.insideBooks')}</h3>
              <PassageHits hits={getVisibleItems(passageHits)} compact />
              {!showAll && getRemainingCount(passageHits) > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-left text-sm text-primary dark:text-primaryLight hover:underline mt-3 font-semibold"
                >
                  {t('common.showMore', { count: getRemainingCount(passageHits) })}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSuggestions;
