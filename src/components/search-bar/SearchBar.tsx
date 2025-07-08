import { RiArrowRightDoubleFill } from 'react-icons/ri';
import useAppContext from '../../hooks/contexts/useAppContext';
import { useTranslation } from 'react-i18next';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../buttons/Button';
import ElviraInput from '../inputs/ElviraInput';
import FeedAutofill from '../autofills/FeedAutofill';
import CategoryAutofill from '../autofills/CategoryAutofill';
import { ICategory } from '../../utils/interfaces/category';

const SearchBar = () => {
  const { setShowSearchBar, isSmallDevice, stuBg } = useAppContext();
  const { t } = useTranslation();
  const [activeFeeds, setActiveFeeds] = useState<{
    feeds: { title: string; id: string }[];
  }>({ feeds: [] });
  const [activeCategory, setActiveCategory] = useState<{
    categories: ICategory[];
  }>({ categories: [] });
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title) searchParams.set('title', title);
    else searchParams.delete('title');

    if (author) searchParams.set('author', author);
    else searchParams.delete('author');

    if (activeCategory.categories.length > 0)
      searchParams.set('category-id', activeCategory.categories[0].id);
    else searchParams.delete('category-id');

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
          className={`${stuBg} text-white h-fit w-fit rounded-md p-2`}
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
          <CategoryAutofill
            entryForm={activeCategory}
            setEntryForm={setActiveCategory}
            single
            setIsSelectionOpen={() => {}}
          />
        </div>

        <div className='w-full'>
          <FeedAutofill
            entryForm={activeFeeds}
            setEntryForm={setActiveFeeds}
            single
            setIsSelectionOpen={() => {}}
          />
        </div>

        <div className='fixed bottom-5'>
          <Button type='submit'>{t('searchBar.search')}</Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;
