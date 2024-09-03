import { RiArrowRightDoubleFill } from 'react-icons/ri';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Button from '../common/Button';
import ElviraInput from '../inputs/ElviraInput';
import FeedAutofill from '../inputs/FeedAutofill';
import { IEntryNewForm } from '../../utils/interfaces/entry';
import { MdRemoveCircle } from 'react-icons/md';

const SearchBar = () => {
  const { setShowSearchBar, isSmallDevice } = useAppContext();
  const { t } = useTranslation();
  const [activeFeeds, setActiveFeeds] = useState<{
    feeds: { title: string; id: string }[];
  }>({ feeds: [] });
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [year, setYear] = useState<number[]>([1950, new Date().getFullYear()]);
  const [searchParams, setSearchParams] = useSearchParams();

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

    if (activeFeeds.feeds.length > 0)
      searchParams.set('feed-id', activeFeeds.feeds[0].id);
    else searchParams.delete('feed-id');

    searchParams.set('publishedAtGte', year[0].toString());
    searchParams.set('publishedAtLte', year[1].toString());

    setSearchParams(searchParams);
  };

  return (
    <div
      className={`${
        isSmallDevice ? 'w-full' : 'w-64'
      } flex flex-col gap-2 h-full bg-zinc-100 dark:bg-darkGray p-4 pb-14 overflow-auto`}
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
        className='flex-1 bg-zinc-100 dark:bg-darkGray py-4 flex flex-col gap-4 rounded-md items-center'
      >
        <div className='w-full'>
          <ElviraInput
            placeholder={t('searchBar.title')}
            value={title}
            onChange={handleTitleChange}
          />
        </div>

        <div className='w-full'>
          <ElviraInput
            placeholder={t('searchBar.author')}
            value={author}
            onChange={handleAuthorChange}
          />
        </div>

        <div className='w-full'>
          <ElviraInput
            placeholder={t('searchBar.category')}
            value={category}
            onChange={handleCategoryChange}
          />
        </div>

        <div className='w-full'>
          <span>{t('searchBar.year')}</span>
          <div className='w-full px-2'>
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
          </div>
          <div className={'flex w-full justify-between'}>
            <span>
              {t('searchBar.from')}: {year[0]}
            </span>
            <span>
              {t('searchBar.to')}: {year[1]}
            </span>
          </div>
        </div>

        <div className='w-full'>
          <span>{t('searchBar.feeds')}</span>
          <div className='flex flex-col gap-2 mt-2 w-full'>
            <FeedAutofill
              entryForm={activeFeeds}
              setEntryForm={setActiveFeeds}
              single
            />
            {activeFeeds?.feeds?.map((item, index) => (
              <div key={index} className={`h-fit`}>
                <button
                  type='button'
                  className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
                  onClick={() => {
                    setActiveFeeds((prev) => ({
                      ...prev!,
                      feeds: prev!.feeds.filter(
                        (prevFeed) => prevFeed.id !== item.id
                      ),
                    }));
                  }}
                >
                  {item.title}
                  <MdRemoveCircle size={15} />
                </button>
              </div>
            ))}
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
