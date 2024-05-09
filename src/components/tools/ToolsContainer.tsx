import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useLocation, useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { FaFilterCircleXmark } from 'react-icons/fa6';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

interface IToolsContainerParams {
  advancedSearch?: boolean;
  param: string;
}

const ToolsContainer = ({ advancedSearch, param }: IToolsContainerParams) => {
  const { t } = useTranslation();
  const { showSearchBar, setShowSearchBar, clearFilters, isParamsEmpty } =
    useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState<string>('');
  const [selection, setSelection] = useState('-created_at');

  const location = useLocation();

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
    setInput('');
    clearFilters();
  };

  return (
    <div className='flex gap-4 px-4 pb-4 md:items-start flex-col md:flex-row'>
      <div className='w-full md:w-1/2 xl:w-1/4'>
        <div className='flex gap-4'>
          <form
            className='relative flex w-full items-center gap-2 text-darkGray dark:text-white'
            onSubmit={submit}
          >
            <input
              className={
                'w-full p-2 rounded-md bg-zinc-200 dark:bg-darkGray border-2 border-zinc-200 dark:border-darkGray outline-none focus:border-STUColor dark:focus:border-STUColor'
              }
              type={'text'}
              name={'searchTitle'}
              value={input}
              placeholder={t('tools.search')}
              onChange={handleSearchInput}
            />

            <button type='submit' className={'absolute right-2'}>
              <IoSearchOutline size={30} />
            </button>
          </form>

          {!isParamsEmpty() && (
            <button className='text-red' onClick={handleClear}>
              <FaFilterCircleXmark size={25} />
            </button>
          )}
        </div>

        {/* Only for entries */}
        {advancedSearch && (
          <button
            className='text-sm ml-1 hover:underline mt-2'
            onClick={() => setShowSearchBar(!showSearchBar)}
          >
            {t('tools.advancedSearch')}
          </button>
        )}
      </div>

      <div className='flex gap-3 items-start text-[15px] md:mt-2.5'>
        <select
          className='bg-transparent cursor-pointer outline-none uppercase text-left'
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
  );
};

export default ToolsContainer;
