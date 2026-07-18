import { useSearchParams } from 'react-router-dom';
import { ReactNode, useRef, useState } from 'react';
import Breadcrumb from '../../buttons/Breadcrumb';
import PageLoading from '../../page/PageLoading';
import PageMessage from '../../page/PageMessage';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ToolsContainer from '../../tools/ToolsContainer';
import EntryDetail from '../entry/details/EntryDetail';
import { H1 } from '../../primitives/Heading';
import { AdvancedSearchWrapper } from './AdvancedSearch';
import OpenFiltersButton from '../../buttons/OpenFiltersButton';
import LicenseCalendar from '../entry/details/LicenseCalendar';
import { IItemContainerList } from '../../../hooks/api/useInfiniteItemContainer';

interface IItemContainer {
  children: ReactNode;
  list: IItemContainerList;
  showLayout?: boolean;
  isEntries?: boolean;
  triggerReload?: (() => void) | null;
  searchSpecifier: string;
  title?: string;
  customFilters?: ReactNode;
  description?: string;
  shouldRedirectSuggestions?: boolean;
  showResultsHeading?: boolean;
}

const ItemContainer = ({
  children,
  list,
  triggerReload = null,
  showLayout = false,
  isEntries = true,
  searchSpecifier,
  title,
  customFilters,
  description,
  shouldRedirectSuggestions = false,
  showResultsHeading = true,
}: IItemContainer) => {
  const { handleScroll } = useAppContext();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Filter/search resets are driven by the query key inside
  // `useInfiniteItemContainer` (React Query), so the old imperative reset effect
  // that wiped `items`/`page` here is gone — it only caused the grid to flash to
  // a skeleton on every param change.

  // Background refetch (new filter/search while previous results stay visible).
  const isRefreshing = list.isFetching && !list.isLoading;

  return (
    <>
      {/* Thin top progress bar during background refreshes — replaces the
          full-grid skeleton wipe so filtering/searching feels continuous. */}
      {isRefreshing && (
        <div className='absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden'>
          <div className='h-full w-1/3 animate-[loadingbar_1s_ease-in-out_infinite] bg-primary' />
        </div>
      )}
      <div
        ref={scrollRef}
        className='relative flex h-screen flex-col w-full overflow-auto pt-4'
        onScroll={() =>
          handleScroll(
            scrollRef,
            list.page,
            list.setPage,
            list.maxPage,
            list.loadingNext,
            list.setLoadingNext,
            showScrollUp,
            setShowScrollUp
          )
        }
      >
        <Breadcrumb/>
        {title && <H1 className='pt-3'>{title}</H1>}
        {description && <p className="px-4 text-secondary dark:text-secondaryLight text-sm mb-4">{description}</p>}
        <ToolsContainer
          param={searchSpecifier}
          advancedSearch={isEntries}
          customFilters={customFilters}
          shouldRedirectSuggestions={shouldRedirectSuggestions}
        />

        <AdvancedSearchWrapper>
          <>
            {showResultsHeading && (
              <h2 className='px-4 text-secondary dark:text-secondaryLight text-lg font-medium text-left mb-4'>
                {searchParams.get('author') && !searchParams.get('query') ? searchParams.get('author') :
                searchParams.get('query') ? t('page.resultsQuery') :
                ""}
                {searchParams.get('query') && <span className="font-bold ml-1">"{searchParams.get('query')}"</span>}
              </h2>
            )}

            {list.isLoading && <PageLoading entries={isEntries} showLayout={showLayout} />}

            {!list.isLoading && list.isError && <PageMessage message={t('page.error')} />}

            {!list.isLoading && !list.isError && (
              <>
                {list.items.length > 0 ? (
                  children
                ) : (
                  <p className='text-center px-4 py-10'>{t('page.noResults')}</p>
                )}
              </>
            )}
            <OpenFiltersButton />
            <EntryDetail triggerReload={triggerReload} />
            <LicenseCalendar />
          </>
        </AdvancedSearchWrapper>
      </div>
    </>
  );
};

export default ItemContainer;
