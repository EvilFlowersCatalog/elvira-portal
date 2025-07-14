import { useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import ItemContainer from '../../components/items/container/ItemContainer';
import { useTranslation } from 'react-i18next';

const Loans = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const { t } = useTranslation();

  return (
    <ItemContainer
      activeEntryId={activeEntryId}
      setActiveEntryId={setActiveEntryId}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      items={entries}
      setItems={setEntries}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
      showLayout
      searchSpecifier={'query'}
      title={t('navbarMenu.loans')}
    >
      <div className='flex flex-wrap px-4 pb-4'>Loans</div>
    </ItemContainer>
  );
};

export default Loans;
