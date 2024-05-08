import { RiArrowRightDoubleFill } from 'react-icons/ri';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';
import { ChangeEvent, FormEvent, useState } from 'react';
import useGetFeeds from '../../../hooks/api/feeds/useGetFeeds';
import { useSearchParams } from 'react-router-dom';
import useCustomEffect from '../../../hooks/useCustomEffect';
import { IFeed } from '../../../utils/interfaces/feed';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import FeedMenu from '../../feed/FeedMenu';
import Button from '../../common/Button';

interface ISearchBarInputParams {
  name: string;
  placeholder: string;
  value: any;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const SearchBarInput = ({
  name,
  value,
  onChange,
  placeholder,
}: ISearchBarInputParams) => {
  return (
    <input
      name={name}
      placeholder={placeholder}
      className='w-full p-2 rounded-md bg-zinc-200 dark:bg-gray border-2 border-zinc-100 dark:border-darkGray outline-none focus:border-STUColor dark:focus:border-STUColor'
      value={value}
      type='text'
      onChange={onChange}
    />
  );
};

const SearchBar = () => {
  const { setShowSearchBar, isSmallDevice } = useAppContext();
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >([]);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [year, setYear] = useState<number[]>([1950, new Date().getFullYear()]);
  const [searchParams, setSearchParams] = useSearchParams();

  const getFeeds = useGetFeeds();

  const handleYearChange = (_: Event, newValue: number | number[]) => {
    setYear(newValue as number[]);
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleAuthorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCategory(e.target.value);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title) searchParams.set('title', title);
    else searchParams.delete('title');

    if (author) searchParams.set('author', author);
    else searchParams.delete('author');

    if (activeFeeds.length > 0) searchParams.set('feed-id', activeFeeds[0].id);
    else searchParams.delete('feed-id');

    searchParams.set('publishedAtGte', year[0].toString());
    searchParams.set('publishedAtLte', year[1].toString());

    setSearchParams(searchParams);
  };

  useCustomEffect(() => {
    (async () => {
      try {
        const { items } = await getFeeds({
          paginate: false,
          kind: 'acquisition',
        });
        setFeeds(items);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className={`${
        isSmallDevice ? 'w-full' : 'w-64'
      } flex flex-col gap-2 min-w-64 h-full bg-zinc-100 dark:bg-darkGray p-4 pb-14 overflow-auto`}
    >
      <div className='flex flex-col justify-between text-center gap-4'>
        <button
          className='bg-STUColor text-white h-fit w-fit rounded-md p-2'
          onClick={() => setShowSearchBar(false)}
        >
          <RiArrowRightDoubleFill size={18} />
        </button>

        <h1 className='text-xl font-extrabold'>
          {t('searchBar.advancedSearch')}
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className='flex-1 bg-zinc-100 dark:bg-darkGray py-4 flex flex-col gap-5 rounded-md items-center'
      >
        <div className='w-full'>
          <SearchBarInput
            placeholder={t('searchBar.title')}
            name='title'
            value={title}
            onChange={handleTitleChange}
          />
        </div>

        <div className='w-full'>
          <SearchBarInput
            placeholder={t('searchBar.author')}
            name='author'
            value={author}
            onChange={handleAuthorChange}
          />
        </div>

        <div className='w-full'>
          <SearchBarInput
            placeholder={t('searchBar.category')}
            name='category'
            value={category}
            onChange={handleCategoryChange}
          />
        </div>

        <div className='px-3 w-full'>
          <span>{t('searchBar.year')}</span>
          <Box
            sx={{
              width: '100%',
              '& .MuiSlider-thumb': {
                borderRadius: '3px',
              },
            }}
          >
            <Slider
              max={2024}
              min={1950}
              step={1}
              value={year}
              disableSwap
              onChange={handleYearChange}
            />
          </Box>
          <div className={'flex w-full justify-between'}>
            <span>
              {t('searchBar.from')}: {year[0]}
            </span>
            <span>
              {t('searchBar.to')}: {year[1]}
            </span>
          </div>
        </div>

        <div className=''>
          <span>{t('searchBar.feeds')}</span>
          <div className='overflow-auto p-2 mt-2'>
            <FeedMenu
              isLoading={isLoading}
              activeFeeds={activeFeeds}
              setActiveFeeds={setActiveFeeds}
              feeds={feeds}
              searchBar
            />
          </div>
        </div>

        <div className='fixed bottom-5'>
          <Button type='submit'>
            <span>{t('searchBar.search')}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
