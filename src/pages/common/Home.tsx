import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import PageLoading from '../../components/page/PageLoading';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import SwiperEntry from '../../components/entry/SwiperEntry';
import EntryDetail from '../../components/entry/EntryDetail';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useCustomEffect from '../../hooks/useCustomEffect';
import { IoSearchOutline } from 'react-icons/io5';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

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

  return isLoading ? (
    <PageLoading />
  ) : (
    <>
      <div className='flex-1 p-4'>
        <div className='flex items-center flex-col gap-10 px-5 py-20'>
          <img
            className='w-full md:w-2/3 lg:w-1/2 max-w-[800px]'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          />
          <form
            className='relative flex w-full md:w-1/2 xl:w-1/3 max-w-96 items-center gap-2 text-darkGray dark:text-white'
            onSubmit={submit}
          >
            <input
              className={
                'w-full p-2 rounded-md bg-zinc-200 dark:bg-darkGray border-2 border-white dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor'
              }
              type={'text'}
              name={'searchTitle'}
              value={searchInput}
              placeholder={t('home.search')}
              onChange={handleSearchInput}
            />
            <button type='submit' className={'absolute right-2'}>
              <IoSearchOutline size={30} />
            </button>
          </form>
        </div>

        <h1 className='text-lg mb-2 font-medium'>{t('home.popular')}</h1>
        <Swiper
          slidesPerView='auto'
          loop
          autoplay={{
            delay: 1000,
            disableOnInteraction: false,
          }}
          modules={[Autoplay]}
        >
          {popularEntries.map((entry, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <SwiperEntry
                clickedEntry={clickedEntry}
                setClickedEntry={setClickedEntry}
                type='popular'
                entry={entry}
                isActive={
                  clickedEntry === 'popular' && activeEntryId === entry.id
                }
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <h1 className='text-lg mb-2 font-medium'>{t('home.lastAdded')}</h1>
        <Swiper
          slidesPerView='auto'
          loop
          autoplay={{
            delay: 1000,
            reverseDirection: true,
            disableOnInteraction: false,
          }}
          modules={[Autoplay]}
        >
          {lastAddedEntries.map((entry, index) => (
            <SwiperSlide className='max-w-52' key={index}>
              <SwiperEntry
                clickedEntry={clickedEntry}
                setClickedEntry={setClickedEntry}
                type='lastAdded'
                entry={entry}
                isActive={
                  clickedEntry === 'lastAdded' && activeEntryId === entry.id
                }
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {activeEntryId && <EntryDetail />}
    </>
  );
};

export default Home;
