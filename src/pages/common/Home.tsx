import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useCustomEffect from '../../hooks/useCustomEffect';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import HomeHeader from '../../components/specific-page/home-page/HomeHeader';
import SwiperContainer from '../../components/specific-page/home-page/swiper/SwiperContainer';
import EntryDetail from '../../components/items/entry/EntryDetail';

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

  useCustomEffect(() => {
    (async () => {
      try {
        const { items: popular } = await getEntries({
          page: 1,
          limit: 30,
          orderBy: '-popularity',
        });
        setPopularEntries(popular);

        const { items: lastAdded } = await getEntries({
          page: 1,
          limit: 30,
          orderBy: '-created_at',
        });
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
      <div className='w-full h-full p-4 pt-14 lg:pt-4'>
        <HomeHeader />

        {/* POPULAR */}
        <h1 className='text-lg mb-2 font-medium'>{t('home.popular')}</h1>
        <SwiperContainer
          isLoading={isLoading}
          entries={popularEntries}
          setClickedEntry={setClickedEntry}
          clickedEntry={clickedEntry}
          activeEntryId={activeEntryId}
          type='popular'
        />

        <div className='h-10'></div>

        {/* LAST ADDED */}
        <h1 className='text-lg mb-2 font-medium'>{t('home.lastAdded')}</h1>
        <SwiperContainer
          isLoading={isLoading}
          entries={lastAddedEntries}
          setClickedEntry={setClickedEntry}
          clickedEntry={clickedEntry}
          activeEntryId={activeEntryId}
          type='lastAdded'
        />
      </div>
      {activeEntryId && <EntryDetail />}
    </>
  );
};

export default Home;
