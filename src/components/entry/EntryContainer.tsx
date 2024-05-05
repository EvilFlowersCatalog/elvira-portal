import { useSearchParams } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import EntryInfo from './EntryInfo';
import Breadcrumb from '../common/Breadcrumb';
import PageLoading from '../page/PageLoading';
import PageMessage from '../page/PageMessage';
import { useTranslation } from 'react-i18next';
import { IEntry } from '../../utils/interfaces/entry';
import useAppContext from '../../hooks/contexts/useAppContext';
import LoadNext from '../common/LoadNext';
import ScrollUpButton from '../common/ScrollUpButton';
import ToolsContainer from '../tools/ToolsContainer';

interface IEntryContainer {
  children: ReactNode;
  activeEntryId?: string | null;
  setActiveEntryId?: ((activeEntryId: string | null) => void) | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isError: boolean;
  entries: IEntry[];
  setEntries: (entries: IEntry[]) => void;
  triggerReload?: (() => void) | null;
  page: number;
  setPage: (page: number) => void;
  maxPage: number;
  loadingNext: boolean;
  setLoadingNext: (loadingNext: boolean) => void;
}

const EntryContainer = ({
  children,
  activeEntryId = null,
  setActiveEntryId = null,
  isLoading,
  isError,
  entries,
  setEntries,
  triggerReload = null,
  setIsLoading,
  page,
  loadingNext,
  setLoadingNext,
  setPage,
  maxPage,
}: IEntryContainer) => {
  const { handleScroll, searchParamsEqual, clearFilters } = useAppContext();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousSearchParamsRef = useRef<URLSearchParams | null>(null);

  // Check search params if there is entry-detail-id
  useEffect(() => {
    // If they are not equal reset
    if (!searchParamsEqual(previousSearchParamsRef.current, searchParams)) {
      setPage(0);
      setEntries([]);
      setIsLoading(true);
    }

    // Set previous to current
    previousSearchParamsRef.current = searchParams;

    const entryDetailId = searchParams.get('entry-detail-id');
    if (setActiveEntryId) {
      if (entryDetailId) setActiveEntryId(entryDetailId);
      else setActiveEntryId(null);
    }
  }, [searchParams]);

  return (
    <>
      <div
        ref={scrollRef}
        className='flex flex-col flex-1 overflow-auto'
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
        {isLoading && <PageLoading />}
        {!isLoading && isError && <PageMessage message={t('page.error')} />}
        {!isLoading && !isError && entries.length > 0 && (
          <>
            <ToolsContainer />
            {children}
            {loadingNext && <LoadNext />}
          </>
        )}
        {!isLoading &&
          !isError &&
          entries.length === 0 &&
          (searchParams.toString() !== '' ? (
            <PageMessage
              message={t('page.notFound')}
              clearParams={clearFilters}
            />
          ) : (
            // Possible only in shelf
            <PageMessage message={t('page.shelfEmpty')} />
          ))}
      </div>
      {showScrollUp && <ScrollUpButton scrollRef={scrollRef} />}
      {activeEntryId && (
        <EntryInfo triggerReload={triggerReload} entryId={activeEntryId} />
      )}
    </>
  );
};

export default EntryContainer;
