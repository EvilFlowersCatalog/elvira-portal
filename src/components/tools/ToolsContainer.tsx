import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { AcceptedLanguage, getLanguage } from '../../hooks/api/languages/languages';
import useGetCategories from '../../hooks/api/categories/useGetCategories';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { ICategory } from '../../utils/interfaces/category';
import { IFeed } from '../../utils/interfaces/feed';
import i18next from '../../utils/i18n/i18next';
import SearchBar from './SearchBar';
import FilterChips, { FilterChipItem } from './FilterChips';
import SortSelect from './SortSelect';

interface IToolsContainerParams {
  advancedSearch?: boolean;
  param: string;
  aiEnabled?: boolean;
  enableSort?: boolean;
  customFilters?: React.ReactNode;
  enableSuggestions?: boolean;
  shouldRedirectSuggestions?: boolean;
}

const ToolsContainer = ({
  advancedSearch,
  aiEnabled = true,
  enableSort = true,
  param,
  customFilters,
  enableSuggestions = true,
  shouldRedirectSuggestions = false,
}: IToolsContainerParams) => {
  const { t } = useTranslation();
  const { clearFilters, umamiTrack, showAdvancedSearch, setShowAdvancedSearch } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderBy = searchParams.get('order-by') || '-created_at';

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [feeds, setFeeds] = useState<IFeed[]>([]);

  const getCategories = useGetCategories();
  const getFeeds = useGetFeeds();

  useEffect(() => {
    if (!advancedSearch) setShowAdvancedSearch(false);
  }, [advancedSearch]);

  useEffect(() => {
    (async () => {
      const { items: itemsCategories } = await getCategories({ paginate: false });
      const { items: itemsFeeds } = await getFeeds({ paginate: false });
      setCategories(itemsCategories);
      setFeeds(itemsFeeds);
    })();
  }, []);

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'none') searchParams.delete('order-by');
    else searchParams.set('order-by', e.target.value);
    setSearchParams(searchParams);
  };

  const handleClear = () => {
    umamiTrack('Clear Filters Button');
    clearFilters();
  };

  const removeFilter = (paramName: string, itemId?: string) => {
    if (itemId && (paramName === 'categories' || paramName === 'feeds')) {
      const currentValue = searchParams.get(paramName);
      if (currentValue) {
        const items = currentValue.split(',').filter((id) => id !== itemId);
        if (items.length > 0) searchParams.set(paramName, items.join(','));
        else searchParams.delete(paramName);
      }
    } else {
      searchParams.delete(paramName);
    }
    setSearchParams(searchParams);
  };

  const getActiveFilters = (): FilterChipItem[] => {
    const filters: FilterChipItem[] = [];
    const excluded = ['order-by', 'dialog-priority', 'assistant-entry-id', 'feed-id-step', 'parent-id', 'search-all'];

    searchParams.forEach((value, key) => {
      if (excluded.includes(key) || !value.trim()) return;

      if (key === 'categories') {
        value.split(',').forEach((categoryId) => {
          const category = categories.find((c) => c.id === categoryId);
          if (category) filters.push({ key, value: categoryId, label: category.term, itemId: categoryId });
        });
      } else if (key === 'feeds') {
        value.split(',').forEach((feedId) => {
          const feed = feeds.find((f) => f.id === feedId);
          if (feed) filters.push({ key, value: feedId, label: feed.title, itemId: feedId });
        });
      } else {
        let label = value;
        if (key === 'languageCode') {
          label = getLanguage(value)?.name[i18next.language as AcceptedLanguage] || value;
        } else if (key === 'category-id') {
          label = categories.find((c) => c.id === value)?.term || value;
        } else if (key === 'feed-id') {
          label = feeds.find((f) => f.id === value)?.title || value;
        } else if (key === 'publishedAtGte') {
          label = `${t('searchBar.yearFrom')}: ${value}`;
        } else if (key === 'publishedAtLte') {
          label = `${t('searchBar.yearTo')}: ${value}`;
        }
        filters.push({ key, value, label });
      }
    });

    return filters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="flex gap-4 px-4 item-start flex-col md:flex-row z-10">
      <div className="w-full pl-1 pb-2 border-b-2 border-gray-300 dark:border-gray-700">
        <div className="flex gap-4 items-center">
          <SearchBar
            param={param}
            aiEnabled={aiEnabled}
            enableSuggestions={enableSuggestions}
            shouldRedirectSuggestions={shouldRedirectSuggestions}
          />
        </div>

        <div className="transition-all duration-400 w-full mt-7">
          <div className="grid lg:grid-cols-[auto_1fr_auto] grid-cols-2 gap-3 w-full text-[15px] items-start">
            {advancedSearch && (
              <button
                className="text-sm text-secondary dark:text-secondaryLight font-medium hover:underline whitespace-nowrap w-fit"
                onClick={() => {
                  umamiTrack('Advanced Search Button');
                  setShowAdvancedSearch(!showAdvancedSearch);
                }}
              >
                {t('tools.advancedSearch')}
              </button>
            )}
            {customFilters}
            <FilterChips filters={activeFilters} onRemove={removeFilter} onClear={handleClear} />
            {enableSort && <SortSelect value={orderBy} onChange={handleSelectChange} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsContainer;
