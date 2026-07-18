import { useLocation, useSearchParams } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
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
  const { handleScroll, searchParamsEqual } = useAppContext();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousSearchParamsRef = useRef<URLSearchParams | null>(null);

  useEffect(() => {
    if (!searchParamsEqual(previousSearchParamsRef.current, searchParams)) {
      list.setPage(0);
      list.setItems([]);
      list.setIsLoading(true);
    }
    previousSearchParamsRef.current = searchParams;
  }, [searchParams]);

  return (
    <>
      <div
        ref={scrollRef}
        className='flex h-screen flex-col w-full overflow-auto pt-4'
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
