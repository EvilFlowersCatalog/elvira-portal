import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import PageLoading from '../../components/page/PageLoading';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import titleLogoDark from '../../assets/images/elvira-logo/title-logo-dark.png';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import Button from '../../components/common/Button';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import SwiperEntry from '../../components/entry/SwiperEntry';
import EntryInfo from '../../components/entry/EntryInfo';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();
  const { theme, specialNavigation } = useAppContext();
  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [render, setRender] = useState<boolean>(false);

  const getEntries = useGetEntries();

  useEffect(() => {
    if (!render) {
      setRender(true);
      return;
    }

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
  }, [render]);

  useEffect(() => {
    const entryDetailId = searchParams.get('entry-detail-id');
    if (entryDetailId) setActiveEntryId(entryDetailId);
    else setActiveEntryId(null);
  }, [searchParams]);

  return isLoading ? (
    <PageLoading />
  ) : (
    <>
      <div className='flex-1 p-4'>
        <div className='flex items-center flex-col gap-10 px-5 py-20'>
          <img
            className='w-96'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          />
          <Button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.about)}>
            <span className='text-xl'>{t('home.about')}</span>
          </Button>
        </div>
        <h1 className='text-lg mb-2 font-medium'>{t('home.popular')}</h1>
        <div className='overflow-auto'>
          <div className='flex w-fit pb-3'>
            {popularEntries.map((entry, index) => (
              <SwiperEntry
                key={index}
                entry={entry}
                isActive={activeEntryId === entry.id}
              />
            ))}
          </div>
        </div>
        <h1 className='text-lg mb-2 font-medium'>{t('home.lastAdded')}</h1>
        <div className='overflow-auto pb-7'>
          <div className='flex w-fit'>
            {lastAddedEntries.map((entry, index) => (
              <SwiperEntry
                key={index}
                entry={entry}
                isActive={activeEntryId === entry.id}
              />
            ))}
          </div>
        </div>
      </div>
      {activeEntryId && <EntryInfo entryId={activeEntryId} />}
    </>
  );
};

export default Home;
