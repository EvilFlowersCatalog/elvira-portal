import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IFeed } from '../../utils/interfaces/feed';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import ItemContainer from '../../components/items/container/ItemContainer';
import Feed from '../../components/items/feeds/Feed';
import LoadNext from '../../components/items/loadings/LoadNext';
import { useTranslation } from 'react-i18next';
import { Checkbox, FormControlLabel } from '@mui/material';

const Feeds = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingNext, setLoadingNext] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [maxPage, setMaxPage] = useState<number>(0);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [searchParams,setSearchParams] = useSearchParams();
  const [searchAll, setSearchAll] = useState<boolean>(false);

  const { t } = useTranslation();
  const getFeeds = useGetFeeds();

  useEffect(() => {
    if (page === 0) {
      setPage(1);
      return;
    }

    (async () => {
      const fp = searchParams.get('parent-id')?.split('&') ?? [];

      var title = searchParams.get('query') ?? '';
      var parentId = fp.length > 0 ? fp[fp.length - 1] : 'null'
      if (searchAll && title.length > 0) { 
        var params = new URLSearchParams(searchParams);
        params.delete('parent-id');
        setSearchParams(params);
        parentId = ''; 
      }

      const options = {
        paginate: false,
        orderBy: searchParams.get('order-by') ?? '',
        title,
        parentId,
      }

      try {
        const { items, metadata } = await getFeeds(options);

        // Set items and metadata
        setMaxPage(metadata.pages);
        setFeeds([...(feeds ?? []), ...items]);
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

  return (
    <ItemContainer
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      isError={isError}
      items={feeds}
      setItems={setFeeds}
      page={page}
      setPage={setPage}
      maxPage={maxPage}
      loadingNext={loadingNext}
      setLoadingNext={setLoadingNext}
      isEntries={false}
      searchSpecifier={'query'}
      title={t('navbarMenu.feeds')}
      customFilters={
        <div className="flex items-center gap-2">
          <FormControlLabel control={<Checkbox onClick={() => {
            setSearchAll(true);
          }} />} label={t('searchBar.searchAll')} />
        </div>
      }
    >
      <div className='flex flex-wrap px-3 pb-4'>
        {feeds.map((feed, index) => (
          <Feed key={index} feed={feed} />
        ))}
        {loadingNext && <LoadNext />}
      </div>
    </ItemContainer>
  );
};

export default Feeds;
