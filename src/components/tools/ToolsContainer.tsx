import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { FaFilterCircleXmark } from 'react-icons/fa6';
import ElviraInput from '../inputs/ElviraInput';
import CategoryAutofill from '../autofills/CategoryAutofill';
import FeedAutofill from '../autofills/FeedAutofill';
import { ICategory } from '../../utils/interfaces/category';
import Button from '../buttons/Button';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

interface IToolsContainerParams {
  advancedSearch?: boolean;
  param: string;
  aiEnabled?: boolean;
}

const ToolsContainer = ({ advancedSearch, aiEnabled = true, param }: IToolsContainerParams) => {
  const { t } = useTranslation();
  const {
    clearFilters,
    isParamsEmpty,
    umamiTrack,
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const orderBy = searchParams.get('order-by') || '-created_at';
  const [input, setInput] = useState<string>('');
  const [selection, setSelection] = useState('-created_at');

  const [showAdvancedSearch, setShowAdvancedBar] = useState<boolean>(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState<boolean>(false);
  const [activeFeeds, setActiveFeeds] = useState<{
    feeds: { title: string; id: string }[];
  }>({ feeds: [] });
  const [activeCategory, setActiveCategory] = useState<{
    categories: ICategory[];
  }>({ categories: [] });

  const [year, setYear] = useState<number[]>([1950, new Date().getFullYear()]);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
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


  // submit input (search title)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If there is input set it to params else delete it

    if (input) searchParams.set(param, input);
    else searchParams.delete(param);

    setSearchParams(searchParams);
  };

  useEffect(() => {
    const orderBy = searchParams.get('order-by');
    if (orderBy) setSelection(orderBy);
  }, [searchParams]);

  // Handle input
  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    if (e.target.value === 'none') searchParams.delete('order-by');
    else searchParams.set('order-by', e.target.value);
    setSearchParams(searchParams);
  };

  const handleClear = () => {
    umamiTrack('Clear Filters Button');
    setInput('');
    clearFilters();
  };

  return (
    <div className={`flex gap-4 px-4 pb-4 item-start flex-col md:flex-row`}>
      <div className='w-full pl-1'>
        <div className='flex gap-4 items-center'>
          <form
            className='relative flex flex-col flex-1 items-center gap-2 text-darkGray dark:text-white'
            onSubmit={submit}
          >
            <ElviraInput
              type={'text'}
              value={input}
              placeholder={t('tools.search')}
              onChange={handleSearchInput}
              className={`border-none ${aiEnabled ? 'pr-32' : 'pr-10'}`}
              paddingLeft={40}
            />

            <button type='submit' className={'absolute left-2 top-[31px]'}>
              <IoSearchOutline size={25} />
            </button>

            {aiEnabled && (
              <button className='absolute md:right-4 md:bottom-2 size-fit flex items-center gap-2 text-xs text-primary bg-primaryLight rounded-md px-2 py-1 max-md:relative max-md:w-full max-md:flex max-md:justify-center max-md:p-3'>
                <svg className='w-4' viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.5 8.58333C16.5029 9.68322 16.2459 10.7682 15.75 11.75C15.162 12.9264 14.2581 13.916 13.1395 14.6077C12.021 15.2995 10.7319 15.6662 9.41667 15.6667C8.31678 15.6695 7.23176 15.4126 6.25 14.9167L1.5 16.5L3.08333 11.75C2.58744 10.7682 2.33047 9.68322 2.33333 8.58333C2.33384 7.26812 2.70051 5.97904 3.39227 4.86045C4.08402 3.74187 5.07355 2.83797 6.25 2.24999C7.23176 1.7541 8.31678 1.49713 9.41667 1.49999H9.83333C11.5703 1.59582 13.2109 2.32896 14.441 3.55904C15.671 4.78912 16.4042 6.4297 16.5 8.16666V8.58333Z" stroke="#0077CC" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className='whitespace-nowrap'>AI Asistent</p>
              </button>
            )}

          </form>

          {!isParamsEmpty() && (
            <button className='text-red pt-6' onClick={handleClear}>
              <FaFilterCircleXmark size={25} />
            </button>
          )}
        </div>

        <div
          className='flex flex-wrap gap-3 w-full text-[15px] mt-3 items-center'>
          {advancedSearch && (
            <button
              className='text-sm hover:underline'
              onClick={() => {
                umamiTrack('Advanced Search Button');
                setShowAdvancedBar(!showAdvancedSearch);
              }}
            >
              {t('tools.advancedSearch')}
            </button>
          )}
          <Select className="ml-auto" label={"Sort By"} value={orderBy} labelId='sort-label' id="orderBy" onChange={handleSelectChange} variant="standard" >
            <MenuItem value="created_at">{t('tools.orderBy.createdAtAsc')}</MenuItem>
            <MenuItem value="-created_at">{t('tools.orderBy.createdAtDesc')}</MenuItem>
            <MenuItem value="title">{t('tools.orderBy.titleAsc')}</MenuItem>
            <MenuItem value="-title">{t('tools.orderBy.titleDesc')}</MenuItem>
            {/* <MenuItem value="publishedAt">{t('tools.orderBy.publishedAt')}</MenuItem>
            <MenuItem value="-publishedAt">{t('tools.orderBy.publishedAtDesc')}</MenuItem> */}
          </Select>
        </div>

        <form
          onSubmit={onSubmit}
          className={`h-full transition-all duration-400 ${showAdvancedSearch
            ? isSelectionOpen
              ? 'overflow-visible max-h-[500px] mt-4'
              : 'overflow-auto max-h-[500px] mt-4'
            : 'overflow-hidden max-h-0'
            }`}>
          <div className='flex flex-wrap gap-x-4 gap-y-2 mb-4'>
            <div className='max-w-[400px] '>
              <ElviraInput
                placeholder={t('searchBar.title')}
                value={title}
                onChange={handleTitleChange}
              />
            </div>
            <div className='max-w-[400px]'>
              <ElviraInput
                placeholder={t('searchBar.author')}
                value={author}
                onChange={handleAuthorChange}
              />
            </div>
            <div className='max-w-[400px]'>
              <CategoryAutofill
                entryForm={activeCategory}
                setEntryForm={setActiveCategory}
                setIsSelectionOpen={setIsSelectionOpen}
                single
              />
            </div>
            <div className='max-w-[400px]'>
              <FeedAutofill
                entryForm={activeFeeds}
                setEntryForm={setActiveFeeds}
                setIsSelectionOpen={setIsSelectionOpen}
                single
              />
            </div>
          </div>

          <div className=''>
            <Button type='submit'>{t('searchBar.search')}</Button>
          </div>
        </form>

      </div>
    </div >
  );
};

export default ToolsContainer;
