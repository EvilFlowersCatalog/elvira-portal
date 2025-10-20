import { useLocation, useSearchParams } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import Breadcrumb from '../../buttons/Breadcrumb';
import PageLoading from '../../page/PageLoading';
import PageMessage from '../../page/PageMessage';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ScrollUpButton from '../../buttons/ScrollUpButton';
import ToolsContainer from '../../tools/ToolsContainer';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import EntryDetail from '../entry/details/EntryDetail';
import { H1 } from '../../primitives/Heading';
import { AdvancedSearchWrapper } from './AdvancedSearch';
import OpenFiltersButton from '../../buttons/OpenFiltersButton';
import LicenseCalendar from '../entry/details/LicenseCalendar';

interface IItemContainer {
  children: ReactNode;
  isLoading: boolean;
  showLayout?: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isError: boolean;
  items: any[];
  isEntries?: boolean;
  setItems: (entries: any[]) => void;
  triggerReload?: (() => void) | null;
  page: number;
  setPage: (page: number) => void;
  maxPage: number;
  loadingNext: boolean;
  setLoadingNext: (loadingNext: boolean) => void;
  searchSpecifier: string;
  showEmpty?: boolean;
  title: string;
  customFilters?: ReactNode;
}

const ItemContainer = ({
  children,
  isLoading,
  isError,
  items,
  setItems,
  triggerReload = null,
  setIsLoading,
  page,
  loadingNext,
  setLoadingNext,
  setPage,
  maxPage,
  showLayout = false,
  isEntries = true,
  searchSpecifier,
  showEmpty = true,
  title,
  customFilters
}: IItemContainer) => {
  const { handleScroll, searchParamsEqual, clearFilters, isParamsEmpty } = useAppContext();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);

  const location = useLocation();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousSearchParamsRef = useRef<URLSearchParams | null>(null);

  // Check search params if there is entry-detail-id
  useEffect(() => {
    // If they are not equal reset
    if (!searchParamsEqual(previousSearchParamsRef.current, searchParams)) {
      setPage(0);
      setItems([]);
      setIsLoading(true);
    }

    // Set previous to current
    previousSearchParamsRef.current = searchParams;

    const entryDetailId = searchParams.get('entry-detail-id');
  }, [searchParams]);

  return (
    <>
      <div
        ref={scrollRef}
        className='flex h-screen flex-col w-full overflow-auto'
        onScroll={() =>
          handleScroll(
            scrollRef,
            page,
            setPage,
            maxPage,
            loadingNext,
            setLoadingNext,
            showScrollUp,
            setShowScrollUp
          )
        }
      >
        <Breadcrumb />
        <H1>{title}</H1>
        <ToolsContainer param={searchSpecifier} advancedSearch={isEntries} customFilters={customFilters} />

        <AdvancedSearchWrapper>
          <>
            <h2 className='px-4 text-secondary dark:text-secondaryLight text-lg font-bold text-left mb-4'>
              {searchParams.get('query')
                ? t('page.resultsQuery', { x: searchParams.get('query') })
                : t('page.results')}
            </h2>

            {isLoading && (
              <PageLoading entries={isEntries} showLayout={showLayout} />
            )}

            {!isLoading && isError && <PageMessage message={t('page.error')} />}


            {!isLoading && !isError && (
              <>
                {showEmpty ? (
                  <>
                    {items.length > 0 && children}
                    {items.length === 0 && (
                      <PageMessage
                        message={
                          isParamsEmpty()
                            ? location.pathname === NAVIGATION_PATHS.shelf
                              ? t('page.shelfEmpty')
                              : t('page.notFound')
                            : t('page.notFound')
                        }
                        clearParams={!isParamsEmpty() ? clearFilters : undefined}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {(items.length === 0 && isParamsEmpty()) || items.length > 0 ? (
                      children
                    ) : (
                      <PageMessage
                        message={t('page.notFound')}
                        clearParams={clearFilters}
                      />
                    )}
                  </>
                )}
              </>
            )}
            <OpenFiltersButton />
            <EntryDetail triggerReload={triggerReload} />
            <LicenseCalendar />
          </>
        </AdvancedSearchWrapper >
      </div>
    </>
  );
};

export default ItemContainer;
