import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import HomeHeader from '../../components/specific-page/home-page/HomeHeader';
import SwiperContainer from '../../components/specific-page/home-page/swiper/SwiperContainer';
import EntryDetail from '../../components/items/entry/EntryDetail';
import EntryDisplay from '../../components/specific-page/home-page/display/EntryDisplay';

const Home = () => {
  const { t } = useTranslation();

  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [clickedEntry, setClickedEntry] = useState<
    'popular' | 'lastAdded' | ''
  >('');
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
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

  useEffect(() => {
    const entryDetailId = searchParams.get('entry-detail-id');
    if (entryDetailId) setActiveEntryId(entryDetailId);
    else setActiveEntryId(null);
  }, [searchParams]);

  return (
    <>
      <div className='w-full h-full p-4 overflow-auto'>
        <HomeHeader />

        {/* POPULAR */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.popular')}</h2>
          <p className='text-sm text-primary cursor-pointer'>Zobraziť všetko</p>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={popularEntries}
          type='popular'
          limitRows={true}
        />
        {/* <SwiperContainer
            isLoading={isLoading}
            entries={popularEntries}
            setClickedEntry={setClickedEntry}
            clickedEntry={clickedEntry}
            activeEntryId={activeEntryId}
            type='popular'
          /> */}

        <div className='h-3'></div>

        {/* LAST ADDED */}
        <div className='flex justify-between items-center mb-5 flex-wrap'>
          <h2 className='text-lg font-bold text-secondary dark:text-secondaryLight'>{t('home.lastAdded')}</h2>
          <p className='text-sm text-primary cursor-pointer'>Zobraziť všetko</p>
        </div>
        <EntryDisplay
          isLoading={isLoading}
          entries={lastAddedEntries}
          type='popular'
          limitRows={true}
        />
        {/* <SwiperContainer
          isLoading={isLoading}
          entries={lastAddedEntries}
          setClickedEntry={setClickedEntry}
          clickedEntry={clickedEntry}
          activeEntryId={activeEntryId}
          type='lastAdded'
        /> */}

      </div>
      {activeEntryId && <EntryDetail />}
    </>
  );
};

export default Home;
