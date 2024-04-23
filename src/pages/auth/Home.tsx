import { useEffect, useState } from 'react';
import { IEntry } from '../../utils/interfaces/entry';
import PageLoading from '../../components/data-page/PageLoading';
import useGetEntries from '../../hooks/api/entries/useGetEntries';
import titleLogoDark from '../../assets/images/elvira-logo/title-logo-dark.png';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import Button from '../../components/common/Button';
import useAppContext from '../../hooks/useAppContext';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import EntryDefault from '../../components/data-page/entry/EntryDefault';

const Home = () => {
  const { theme, specialNavigation } = useAppContext();
  const [popularEntries, setPopularEntries] = useState<IEntry[]>([]);
  const [lastAddedEntries, setLastAddedEntries] = useState<IEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getEntries = useGetEntries();

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const { items: popular } = await getEntries({
          page: 1,
          limit: 20,
          orderBy: '-popularity',
        });
        setPopularEntries(popular);

        const { items: lastAdded } = await getEntries({
          page: 1,
          limit: 20,
          orderBy: '-created_at',
        });
        setLastAddedEntries(lastAdded);
      } finally {
        setIsLoading(false);
      }
    };
    loadEntries();
  }, []);

  return isLoading ? (
    <PageLoading />
  ) : (
    <div className='main-body-without-search'>
      <div className='w-full h-full p-5 overflow-auto gap-5 flex flex-col'>
        <div className='w-full flex items-center flex-col gap-10 px-5 py-20'>
          <img
            className='w-96'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          />
          <Button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.about)}>
            <span className='text-xl'>About</span>
          </Button>
        </div>
        <h1 className='text-2xl text-darkGray dark:text-white font-extrabold'>
          Popular
        </h1>
        <div className='w-full'>
          <div className='flex overflow-auto gap-5 pb-5'>
            {popularEntries.map((entry, index) => (
              <EntryDefault key={index} entry={entry} />
            ))}
          </div>
        </div>
        <h1 className='text-2xl text-darkGray dark:text-white font-extrabold'>
          Lastly Added
        </h1>
        <div className='w-full'>
          <div className='flex overflow-auto gap-5 pb-5'>
            {lastAddedEntries.map((entry, index) => (
              <EntryDefault key={index} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
