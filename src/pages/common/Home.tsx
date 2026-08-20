import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useEntriesQuery from '../../hooks/api/entries/useEntriesQuery';
import HomeHeader from '../../components/specific-page/home-page/HomeHeader';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import EntryDisplay from '../../components/items/entry/display/EntryDisplay';
import ThemedEntryDisplay from '../../components/items/entry/display/ThemedEntryDisplay';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';
import useAppContext from '../../hooks/contexts/useAppContext';
import StepEntryDisplay from '../../components/items/entry/display/StepEntryDisplay';
import useGetFeedDetail from '../../hooks/api/feeds/useGetFeedDetail';

const Home = () => {
  const { t } = useTranslation();
  const { selectedCatalogId } = useAppContext();

  const DBS_FEED_ID = 'afe55681-b71b-4aee-8327-422fbce314e5';

  // Home rows via React Query — each is cached/deduped and refetches when the
  // selected catalog changes (catalog id is part of the query key).
  const { data: popularData, isLoading: popularLoading } = useEntriesQuery({
    limit: 30,
    orderBy: '-popularity',
  });
  const { data: lastAddedData, isLoading: lastAddedLoading } = useEntriesQuery({
    limit: 30,
    orderBy: '-created_at',
  });
  const { data: themedData, isLoading: isThemedLoading } = useEntriesQuery({
    limit: 30,
    feedId: DBS_FEED_ID,
  });

  const popularEntries = popularData?.items ?? [];
  const lastAddedEntries = lastAddedData?.items ?? [];
  const themedEntries = themedData?.items ?? [];
  const isLoading = popularLoading || lastAddedLoading;

  // The DBS collection's title (its entries come from the query above).
  const getFeedDetail = useGetFeedDetail();
  const [themedFeedTitle, setThemedFeedTitle] = useState('');
  useEffect(() => {
    let alive = true;
    getFeedDetail(DBS_FEED_ID)
      .then((f) => alive && setThemedFeedTitle(f.title))
      .catch(() => alive && setThemedFeedTitle(''));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatalogId]);

  return (
    <>
      <div className='w-full h-full p-4 overflow-auto'>
        <HomeHeader />

        {/* POPULAR */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.popular')}</h2>
          <Link to="/library?order-by=-popularity" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</Link>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={popularEntries}
          limitRows={true}
        />


        {/* LAST ADDED */}
        <div className='flex justify-between items-center mb-5 flex-wrap mt-12'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.lastAdded')}</h2>
          <Link to="/library?order-by=-created_at" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</Link>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={lastAddedEntries}
          limitRows={true}
        />



        {/* Themed Feed */}
        {import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true' && (
          <div className='mt-12'>
            <ThemedEntryDisplay
              title={themedFeedTitle}
              color="rgba(145, 48, 169)"
              isLoading={isThemedLoading}
              entries={themedEntries}
              limitRows
            />
          </div>
        )}

        {/* <div className='flex justify-between items-center mb-5 flex-wrap mt-12'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>Learn Data science in 6 books</h2>
          <Link to="/library" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</Link>
        </div>
        <StepEntryDisplay
          isLoading={isLoading}
          entries={lastAddedEntries}
        />

         */}

      </div>
      <EntryDetail />
      <LicenseCalendar />
    </>
  );
};

export default Home;
