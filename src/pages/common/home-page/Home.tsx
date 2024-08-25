import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { IEntry } from '../../../utils/interfaces/entry';
import useGetEntries from '../../../hooks/api/entries/useGetEntries';
import useAppContext from '../../../hooks/contexts/useAppContext';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../../utils/interfaces/general/general';
import EntryDetail from '../../../components/entry/EntryDetail';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useCustomEffect from '../../../hooks/useCustomEffect';
import { IoSearchOutline } from 'react-icons/io5';
import ElviraInput from '../../../components/inputs/ElviraInput';
import SwiperContainer from './components/SwiperContainer';

const Home = () => {
  const { t } = useTranslation();
  const { theme, titleLogoDark, titleLogoLight } = useAppContext();
  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [clickedEntry, setClickedEntry] = useState<
    'popular' | 'lastAdded' | ''
  >('');
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchParams] = useSearchParams();

  const getEntries = useGetEntries();
  const navigate = useNavigate();

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchInput) {
      params.set('query', searchInput);

      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: params.toString(),
      });
    }
  };

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
      <div className='flex-1 p-4'>
        <div className='flex items-center flex-col gap-2 py-14'>
          <img
            className='w-full md:w-1/4'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt='Elvira Logo'
          />
          <p className='text-2xl font-extrabold'>{t('about.title')}</p>
          <p>{t('about.subTitle')}</p>

          <form
            className='relative flex w-full md:w-1/2 xl:w-1/3 max-w-96 items-center gap-2 text-darkGray dark:text-white mt-5'
            onSubmit={submit}
          >
            <ElviraInput
              type={'text'}
              value={searchInput}
              placeholder={t('home.search')}
              onChange={handleSearchInput}
              backgroundTailwind='bg-zinc-200 dark:bg-darkGray'
            />
            <button type='submit' className={'absolute right-2 top-2.5'}>
              <IoSearchOutline size={25} />
            </button>
          </form>
        </div>

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
