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
  showSearch?: boolean;
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
  title?: string;
  customFilters?: ReactNode;
  description?: string;
  shouldRedirectSuggestions?: boolean;
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
  customFilters,
  description,
  shouldRedirectSuggestions = false,
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
        {title && <H1>{title}</H1>}
        {description && <p className="px-4 text-secondary dark:text-secondaryLight text-sm mb-4">{description}</p>}
        <ToolsContainer 
          param={searchSpecifier} 
          advancedSearch={isEntries} 
          customFilters={customFilters}
          shouldRedirectSuggestions={shouldRedirectSuggestions}
        />

        <AdvancedSearchWrapper>
          <>
            <h2 className='px-4 text-secondary dark:text-secondaryLight text-lg font-medium text-left mb-4'>
              {searchParams.get('query')
                ? t('page.resultsQuery')
                : t('page.results')}
                {searchParams.get('query') && <span className="font-bold ml-1">"{searchParams.get('query')}"</span>}
            </h2>

            {isLoading && (
              <PageLoading entries={isEntries} showLayout={showLayout} />
            )}

            {!isLoading && isError && <PageMessage message={t('page.error')} />}


            {!isLoading && !isError && (
              <>
                {items.length > 0 ? (
                  children
                ) : (
                  <p className='text-center px-4 py-10'>
                    {t('page.noResults')}
                  </p>
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
