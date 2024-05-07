import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Breadcrumb from '../../components/common/Breadcrumb';
import Button from '../../components/common/Button';
import useGetFeeds from '../../hooks/api/feeds/useGetFeeds';
import { IFeed } from '../../utils/interfaces/feed';
import FeedMenu from '../../components/feed/FeedMenu';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import useCustomEffect from '../../hooks/useCustomEffect';

interface IAdvancedSearchInputParams {
  name: string;
  value: any;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const AdvancedSearchInput = ({
  name,
  value,
  onChange,
}: IAdvancedSearchInputParams) => {
  return (
    <input
      name={name}
      className='w-full p-2 rounded-md bg-zinc-200 dark:bg-darkGray border-2 border-zinc-100 dark:border-gray outline-none focus:border-STUColor dark:focus:border-STUColor'
      value={value}
      type='text'
      onChange={onChange}
    />
  );
};

const AdvancedSearch = () => {
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

  const getFeeds = useGetFeeds();
  const navigate = useNavigate();

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

    const params = new URLSearchParams();
    if (title) params.set('title', title);
    if (author) params.set('author', author);
    if (activeFeeds.length > 0) params.set('feed-id', activeFeeds[0].id);
    params.set('publishedAtGte', year[0].toString());
    params.set('publishedAtLte', year[1].toString());

    navigate({
      pathname: NAVIGATION_PATHS.library,
      search: params.toString(),
    });
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
    <div className='flex flex-col flex-1 overflow-auto'>
      <Breadcrumb />
      <div className='flex flex-col flex-1 gap-5 justify-start items-center p-4'>
        <h1 className='text-3xl font-extrabold text-center'>
          {t('advancedSearch.advanced')}
        </h1>
        <form
          onSubmit={onSubmit}
          className='w-full md:w-2/3 lg:w-4/6 xl:w-3/5 xxl:w-2/5 bg-zinc-100 dark:bg-darkGray h-fit p-4 flex flex-col gap-5 rounded-md'
        >
          <div>
            <span>{t('advancedSearch.title')}</span>
            <AdvancedSearchInput
              name='title'
              value={title}
              onChange={handleTitleChange}
            />
          </div>

          <div>
            <span>{t('advancedSearch.author')}</span>
            <AdvancedSearchInput
              name='author'
              value={author}
              onChange={handleAuthorChange}
            />
          </div>

          <div>
            <span>{t('advancedSearch.category')}</span>
            <AdvancedSearchInput
              name='category'
              value={category}
              onChange={handleCategoryChange}
            />
          </div>

          <div>
            <span>{t('advancedSearch.year')}</span>
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
                {t('advancedSearch.from')}: {year[0]}
              </span>
              <span>
                {t('advancedSearch.to')}: {year[1]}
              </span>
            </div>
          </div>

          <div>
            <span>{t('advancedSearch.feeds')}</span>
            <div className='max-h-80 overflow-auto  '>
              <FeedMenu
                isLoading={isLoading}
                activeFeeds={activeFeeds}
                setActiveFeeds={setActiveFeeds}
                feeds={feeds}
              />
            </div>
          </div>

          <div className='flex justify-center mt-5'>
            <Button type='submit'>
              <span>{t('advancedSearch.search')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearch;
