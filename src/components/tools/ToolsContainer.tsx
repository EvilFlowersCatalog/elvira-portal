import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoSearchOutline } from 'react-icons/io5';
import { useSearchParams } from 'react-router-dom';
import useAppContext from '../../hooks/contexts/useAppContext';
import { FaFilterCircleXmark, FaList } from 'react-icons/fa6';
import { LAYOUT_TYPE } from '../../utils/interfaces/general/general';
import ElviraInput from '../inputs/ElviraInput';
import { HiMiniSquares2X2 } from 'react-icons/hi2';

interface IToolsContainerParams {
  advancedSearch?: boolean;
  showLayout?: boolean;
  param: string;
}

const ToolsContainer = ({
  advancedSearch,
  param,
  showLayout = false,
}: IToolsContainerParams) => {
  const { t } = useTranslation();
  const {
    showSearchBar,
    setShowSearchBar,
    clearFilters,
    isParamsEmpty,
    updateLayout,
    layout,
    isSmallDevice,
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
    umami.track('Clear Filters Button');
    setInput('');
    clearFilters();
  };

  return (
    <div className={`flex gap-4 px-4 pb-4 item-start flex-col md:flex-row`}>
      <div className='w-full md:w-1/2 xl:w-1/4 pl-1'>
        <div className='flex gap-4 items-center'>
          {!isSmallDevice &&
            showLayout &&
            (layout === LAYOUT_TYPE.list ? (
              <FaList
                size={30}
                className='cursor-pointer mt-4'
                onClick={() => updateLayout(LAYOUT_TYPE.box)}
              />
            ) : (
              <HiMiniSquares2X2
                size={30}
                className='cursor-pointer mt-4'
                onClick={() => updateLayout(LAYOUT_TYPE.list)}
              />
            ))}
          <form
            className='relative flex flex-1 items-center gap-2 text-darkGray dark:text-white'
            onSubmit={submit}
          >
            <ElviraInput
              type={'text'}
              value={input}
              placeholder={t('tools.search')}
              onChange={handleSearchInput}
              className='bg-zinc-200 dark:bg-darkGray'
            />

            <button type='submit' className={'absolute right-2 top-[29px]'}>
              <IoSearchOutline size={25} />
            </button>
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
              umami.track('Advanced Search Button');
              setShowSearchBar(!showSearchBar);
            }}
          >
            {t('tools.advancedSearch')}
          </button>
        )}
      </div>

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
  );
};

export default ToolsContainer;
