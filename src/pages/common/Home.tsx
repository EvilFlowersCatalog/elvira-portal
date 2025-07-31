import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import HomeHeader from '../../components/specific-page/home-page/HomeHeader';
import EntryDetail from '../../components/items/entry/details/EntryDetail';
import EntryDisplay from '../../components/items/entry/display/EntryDisplay';
import LicenseCalendar from '../../components/items/entry/details/LicenseCalendar';
import AiAssistant from '../../components/dialogs/AiAssistant';

const Home = () => {
  const { t } = useTranslation();

  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [clickedEntry, setClickedEntry] = useState<
    'popular' | 'lastAdded' | ''
  >('');
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams] = useSearchParams();

  const getEntries = useGetEntries();

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
  }, []);

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
          type='popular'
          limitRows={true}
        />

        <div className='h-3'></div>

        {/* LAST ADDED */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.lastAdded')}</h2>
          <a href="/library?order-by=-created_at" className='text-sm text-primary cursor-pointer'>Zobraziť všetko</a>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={lastAddedEntries}
          type='popular'
          limitRows={true}
        />
      </div>
      <EntryDetail />
      <LicenseCalendar />
    </>
  );
};

export default Home;
