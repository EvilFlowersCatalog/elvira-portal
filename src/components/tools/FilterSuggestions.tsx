import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import useGetEntries from "../../hooks/api/entries/useGetEntries";
import { ICategory } from "../../utils/interfaces/category";
import { IFeed } from "../../utils/interfaces/feed";
import { MdClose } from "react-icons/md";

interface FilterSuggestionsProps {
  searchQuery: string;
}

const FilterSuggestions = ({ searchQuery }: FilterSuggestionsProps) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [authors, setAuthors] = useState<string[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const getEntries = useGetEntries();

  const MAX_ITEMS_PER_COLUMN = 3;

  useEffect(() => {
    // Reset visibility and showAll when searchQuery changes
    setIsVisible(true);
    setShowAll(false);
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAuthors([]);
      setCategories([]);
      setFeeds([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const { items } = await getEntries({
          page: 1,
          limit: 50,
          title: searchQuery,
        });

        // Extract unique authors from returned entries
        const uniqueAuthors = new Set<string>();
        items.forEach(entry => {
          entry.authors?.forEach(author => {
            uniqueAuthors.add(author.name);
          });
        });
        setAuthors(Array.from(uniqueAuthors));

        // Extract unique categories
        const categoriesMap = new Map<string, ICategory>();
        items.forEach(entry => {
          entry.categories?.forEach(cat => {
            if (!categoriesMap.has(cat.id)) {
              categoriesMap.set(cat.id, cat);
            }
          });
        });
        setCategories(Array.from(categoriesMap.values()));

        // Extract unique feeds
        const feedsMap = new Map<string, IFeed>();
        items.forEach(entry => {
          entry.feeds?.forEach(feed => {
            if (!feedsMap.has(feed.id)) {
              feedsMap.set(feed.id, feed);
            }
          });
        });
        setFeeds(Array.from(feedsMap.values()));
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
        setAuthors([]);
        setCategories([]);
        setFeeds([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [searchQuery]);

  const handleAuthorClick = (authorName: string) => {
    searchParams.set('author', authorName);
    setSearchParams(searchParams);
  };

  const handleCategoryClick = (categoryId: string) => {
    const currentCategories = searchParams.get('categories');
    if (currentCategories) {
      const ids = currentCategories.split(',');
      if (!ids.includes(categoryId)) {
        searchParams.set('categories', [...ids, categoryId].join(','));
      }
    } else {
      searchParams.set('categories', categoryId);
    }
    setSearchParams(searchParams);
  };

  const handleFeedClick = (feedId: string) => {
    searchParams.set('feeds', feedId);
    setSearchParams(searchParams);
  };

  const hasResults = authors.length > 0 || categories.length > 0 || feeds.length > 0;

  const getVisibleItems = <T,>(items: T[]): T[] => {
    return showAll ? items : items.slice(0, MAX_ITEMS_PER_COLUMN);
  };

  const getRemainingCount = (items: any[]): number => {
    return Math.max(0, items.length - MAX_ITEMS_PER_COLUMN);
  };

  if (!searchQuery || searchQuery.trim().length < 2 || !isVisible) {
    return null;
  }

  if (!hasResults && !isLoading) {
    return null;
  }

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

        {isLoading ? (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {t('common.loading')}...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pr-8">
            {/* Authors Column */}
            <div className="flex flex-col">
              <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                {t('entry.wizard.authors')}
              </h3>
              {authors.length > 0 ? (
                <>
                  <div className="flex flex-col gap-2">
                    {getVisibleItems(authors).map((author, index) => (
                      <button
                        key={index}
                        onClick={() => handleAuthorClick(author)}
                        className="text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primaryLight transition-colors px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {author}
                      </button>
                    ))}
                  </div>
                  {!showAll && getRemainingCount(authors) > 0 && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-left text-sm text-primary dark:text-primaryLight hover:underline mt-3 font-semibold"
                    >
                      {t('common.showMore', { count: getRemainingCount(authors) })}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('page.noResults')}
                </p>
              )}
            </div>

            {/* Feeds Column */}
            <div className="flex flex-col">
              <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                {t('searchBar.feeds')}
              </h3>
              {feeds.length > 0 ? (
                <>
                  <div className="flex flex-row flex-wrap gap-2">
                    {getVisibleItems(feeds).map((feed) => (
                      <button
                        key={feed.id}
                        onClick={() => handleFeedClick(feed.id)}
                        className="text-left px-3 py-1.5 text-sm bg-primaryLight dark:bg-primaryDark text-primary dark:text-primaryDark hover:opacity-80 transition-opacity rounded-md"
                      >
                        {feed.title}
                      </button>
                    ))}
                  </div>
                  {!showAll && getRemainingCount(feeds) > 0 && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-left text-sm text-primary dark:text-primaryLight hover:underline mt-3 font-semibold"
                    >
                      {t('common.showMore', { count: getRemainingCount(feeds) })}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('page.noResults')}
                </p>
              )}
            </div>

            {/* Categories Column */}
            <div className="flex flex-col">
              <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                {t('searchBar.categories')}
              </h3>
              {categories.length > 0 ? (
                <>
                  <div className="flex flex-row flex-wrap gap-2">
                    {getVisibleItems(categories).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="text-left px-3 py-1.5 text-sm bg-primaryLight dark:bg-primaryDark text-primary dark:text-primaryDark hover:opacity-80 transition-opacity rounded-md"
                      >
                        {category.term}
                      </button>
                    ))}
                  </div>
                  {!showAll && getRemainingCount(categories) > 0 && (
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-left text-sm text-primary dark:text-primaryLight hover:underline mt-3 font-semibold"
                    >
                      {t('common.showMore', { count: getRemainingCount(categories) })}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('page.noResults')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSuggestions;
