import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { FaFilterCircleXmark } from 'react-icons/fa6';
import ElviraInput from '../inputs/ElviraInput';

interface IToolsContainerParams {
  advancedSearch?: boolean;
  param: string;
  aiEnabled?: boolean;
}

const ToolsContainer = ({ advancedSearch, aiEnabled = true, param }: IToolsContainerParams) => {
  const { t } = useTranslation();
  const {
    showSearchBar,
    setShowSearchBar,
    clearFilters,
    isParamsEmpty,
    umamiTrack,
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState<string>('');
  const [selection, setSelection] = useState('-created_at');

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

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
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
                  <path d="M16.5 8.58333C16.5029 9.68322 16.2459 10.7682 15.75 11.75C15.162 12.9264 14.2581 13.916 13.1395 14.6077C12.021 15.2995 10.7319 15.6662 9.41667 15.6667C8.31678 15.6695 7.23176 15.4126 6.25 14.9167L1.5 16.5L3.08333 11.75C2.58744 10.7682 2.33047 9.68322 2.33333 8.58333C2.33384 7.26812 2.70051 5.97904 3.39227 4.86045C4.08402 3.74187 5.07355 2.83797 6.25 2.24999C7.23176 1.7541 8.31678 1.49713 9.41667 1.49999H9.83333C11.5703 1.59582 13.2109 2.32896 14.441 3.55904C15.671 4.78912 16.4042 6.4297 16.5 8.16666V8.58333Z" stroke="#0077CC" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
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

        {/* Only for entries */}
        {advancedSearch && (
          <button
            className='text-sm hover:underline mt-2'
            onClick={() => {
              umamiTrack('Advanced Search Button');
              setShowSearchBar(!showSearchBar);
            }}
          >
            {t('tools.advancedSearch')}
          </button>
        )}

        <div className='flex gap-3 justify-end md:items-start text-[15px]'>
          <select
            className='bg-transparent cursor-pointer outline-none uppercase text-left mt-0 md:mt-[30px]'
            name='orderBy'
            id='orderBy'
            value={selection}
            onChange={handleSelectChange}
          >
            <option value='-created_at'>
              {t('tools.orderBy.createdAtDesc')}
            </option>
            <option value='created_at'>{t('tools.orderBy.createdAtAsc')}</option>
            <option value='-title'>{t('tools.orderBy.titleDesc')}</option>
            <option value='title'>{t('tools.orderBy.titleAsc')}</option>
          </select>
        </div>

      </div>
    </div>
  );
};

export default ToolsContainer;
