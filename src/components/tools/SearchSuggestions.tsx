import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthContext from "../../hooks/contexts/useAuthContext";
import useGetEntries from "../../hooks/api/entries/useGetEntries";
import { IEntry } from "../../utils/interfaces/entry";
import { ICategory } from "../../utils/interfaces/category";
import { IFeed } from "../../utils/interfaces/feed";
import { NAVIGATION_PATHS } from "../../utils/interfaces/general/general";

interface SearchSuggestionsProps {
  searchQuery: string;
  onClose: () => void;
  shouldRedirect?: boolean;
}

const SearchSuggestions = ({ searchQuery, onClose, shouldRedirect = false }: SearchSuggestionsProps) => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getEntries = useGetEntries();

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setEntries([]);
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
          limit: 6,
          title: searchQuery,
        });

        setEntries(items.slice(0, 6));

        // Extract unique authors from returned entries
        const uniqueAuthors = new Set<string>();
        items.forEach(entry => {
          entry.authors?.forEach(author => {
            uniqueAuthors.add(author.name);
          });
        });
        setAuthors(Array.from(uniqueAuthors).slice(0, 10));

        // Extract unique categories
        const categoriesMap = new Map<string, ICategory>();
        items.forEach(entry => {
          entry.categories?.forEach(cat => {
            if (!categoriesMap.has(cat.id)) {
              categoriesMap.set(cat.id, cat);
            }
          });
        });
        setCategories(Array.from(categoriesMap.values()).slice(0, 10));

        // Extract unique feeds
        const feedsMap = new Map<string, IFeed>();
        items.forEach(entry => {
          entry.feeds?.forEach(feed => {
            if (!feedsMap.has(feed.id)) {
              feedsMap.set(feed.id, feed);
            }
          });
        });
        setFeeds(Array.from(feedsMap.values()).slice(0, 10));
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
        setEntries([]);
        setAuthors([]);
        setCategories([]);
        setFeeds([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleBookClick = (entryId: string) => {
    searchParams.set('entry-detail-id', entryId);
    if (shouldRedirect) {
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: searchParams.toString(),
      });
    } else {
      setSearchParams(searchParams);
    }
    onClose();
  };

  const handleAuthorClick = (authorName: string) => {
    searchParams.set('author', authorName);
    if (shouldRedirect) {
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: searchParams.toString(),
      });
    } else {
      setSearchParams(searchParams);
    }
    onClose();
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
    if (shouldRedirect) {
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: searchParams.toString(),
      });
    } else {
      setSearchParams(searchParams);
    }
    onClose();
  };

  const handleFeedClick = (feedId: string) => {
    const currentFeeds = searchParams.get('feeds');
    if (currentFeeds) {
      const ids = currentFeeds.split(',');
      if (!ids.includes(feedId)) {
        searchParams.set('feeds', [...ids, feedId].join(','));
      }
    } else {
      searchParams.set('feeds', feedId);
    }
    if (shouldRedirect) {
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: searchParams.toString(),
      });
    } else {
      setSearchParams(searchParams);
    }
    onClose();
  };

  const hasResults = entries.length > 0 || authors.length > 0 || categories.length > 0 || feeds.length > 0;

  if (!searchQuery || searchQuery.trim().length < 2) {
    return null;
  }

  return (
    <div className="absolute top-[70px] left-0 right-0 bg-white dark:bg-darkGray border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-[500px] overflow-auto">
      {isLoading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {t('common.loading')}...
        </div>
      ) : !hasResults ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Žiadne výsledky pre vaše vyhľadávanie
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Books Section - 8 columns */}
          <div className="col-span-12 lg:col-span-8 p-4">
            <h3 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">Knihy</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleBookClick(entry.id)}
                  className="flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
                >
                  <div className="flex-shrink-0 h-16 w-10 rounded overflow-hidden">
                    <img
                      src={entry.thumbnail + `?access_token=${auth?.token}`}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold line-clamp-2 h-8 mb-1 text-secondary dark:text-white">
                      {entry.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.authors?.map(a => a.name).join(', ') || '-'}
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
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Autori</h3>
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
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Skupiny</h3>
                <div className="flex flex-row flex-wrap gap-2">
                  {feeds.map((feed) => (
                    <button
                      key={feed.id}
                      onClick={() => handleFeedClick(feed.id)}
                      className="px-2 py-1 text-xs bg-primaryLight dark:bg-primaryDark text-primary dark:text-primaryDark font-medium transition-colors rounded-md"
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
                <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Kategórie</h3>
                <div className="flex flex-row flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className="px-2 py-1 text-xs bg-primaryLight dark:bg-primaryDark text-primary dark:text-primaryDark font-medium transition-colors rounded-md"
                    >
                      {category.term}
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
