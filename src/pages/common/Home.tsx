import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
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

  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getEntries = useGetEntries();

  // --- DBS FEED ---
  const getFeedDetail = useGetFeedDetail();
  const [themedEntries, setThemedEntries] = useState<IEntry[]>([]);
  const [themedFeedTitle, setThemedFeedTitle] = useState('');
  const [isThemedLoading, setIsThemedLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [{ items }, feed] = await Promise.all([
          getEntries({ page: 1, limit: 30, feedId: 'afe55681-b71b-4aee-8327-422fbce314e5' }),
          getFeedDetail('afe55681-b71b-4aee-8327-422fbce314e5'),
        ]);
        setThemedEntries(items);
        setThemedFeedTitle(feed.title);
      } finally { setIsThemedLoading(false); }
    })();
  }, [selectedCatalogId]);
  // --- END ---

  // Reload entries when catalog changes
  useEffect(() => {
    setPopularEntries([]);
    setLastAddedEntries([]);
    setIsLoading(true);
  }, [selectedCatalogId]);

  useEffect(() => {
    (async () => {
      try {
        const [{ items: popular }, { items: lastAdded }] = await Promise.all([
          getEntries({
            page: 1,
            limit: 30,
            orderBy: '-popularity',
          }),
          getEntries({
            page: 1,
            limit: 30,
            orderBy: '-created_at',
          }),
        ]);

        // Set entries
        setPopularEntries(popular);
        setLastAddedEntries(lastAdded);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedCatalogId]);

  return (
    <>
      <div className='w-full h-full p-4 overflow-auto'>
        <HomeHeader />

        {/* POPULAR */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.popular')}</h2>
          <a href="/library?order-by=-popularity" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</a>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={popularEntries}
          limitRows={true}
        />


        {/* LAST ADDED */}
        <div className='flex justify-between items-center mb-5 flex-wrap mt-12'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.lastAdded')}</h2>
          <a href="/library?order-by=-created_at" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</a>
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
          <a href="/library" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</a>
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
