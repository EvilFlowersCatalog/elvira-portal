import { useEffect, useState } from 'react';
import { IEntry } from '../../../utils/interfaces/entry';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useGetEntries from '../../../hooks/api/entries/useGetEntries';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { MdAdd } from 'react-icons/md';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ItemContainer from '../../../components/items/container/ItemContainer';
import AdminEntry from '../../../components/items/entry/admin/AdminEntry';
import EntryBoxLoading from '../../../components/items/entry/EntryBoxLoading';
import { useTranslation } from 'react-i18next';
import AdminEntriesTable from '../../../components/items/entry/admin/AdminEntriesTable';

const AdminEntries = () => {
  const { stuBorder, stuBg, umamiTrack } = useAppContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [entries, setEntries] = useState<IEntry[]>([]);

  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const getEntries = useGetEntries();
  const navigate = useNavigate();

  useEffect(() => {
    // skip nitialization
    if (page === 0) {
      setPage(1);
      return;
    }

    // get entries
    (async () => {
      try {
        const { items, metadata } = await getEntries({
          page,
          limit: 30,
          title: searchParams.get('title') ?? '',
          feedId: searchParams.get('feed-id') ?? '',
          categoryId: searchParams.get('category-id') ?? '',
          authors: searchParams.get('author') ?? '',
          publishedAtGte: searchParams.get('from') ?? '',
          publishedAtLte: searchParams.get('to') ?? '',
          orderBy: searchParams.get('order-by') ?? '',
          query: searchParams.get('query') ?? '',
        });

        setMaxPage(metadata.pages);
        setEntries([...(entries ?? []), ...items]);
      } catch {
        // if there was error set to true
        setIsError(true);
      } finally {
        // after everything set false
        setIsLoading(false);
        setLoadingNext(false);
      }
    })();
  }, [page]);

  const reload = () => {
    setEntries([]);
    setPage(0);
    setIsLoading(true);
  };

  return (
    <ItemContainer
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
      showEmpty={false}
      searchSpecifier={'query'}
      title={t('administration.homePage.entries.title')}
    >
     <AdminEntriesTable>
        {entries.map((entry, index) => (
          <AdminEntry key={index} entry={entry} reload={reload} />
        ))}
        {loadingNext &&
          Array.from({ length: 30 }).map((_, index) => (
            <EntryBoxLoading key={index} />
          ))}
      </AdminEntriesTable>
    </ItemContainer>
  );
};

export default AdminEntries;
