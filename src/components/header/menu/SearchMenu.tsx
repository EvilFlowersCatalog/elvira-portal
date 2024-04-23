import { ChangeEvent, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { BsFilterSquare, BsFilterSquareFill } from 'react-icons/bs';
import { IoSearchOutline } from 'react-icons/io5';
import { MdFilterAltOff } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import Filter from './Filter';

interface SearchMenuParams {
  showFilterButton?: boolean;
}
const SearchMenu = ({ showFilterButton = false }: SearchMenuParams) => {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState<string>('');

  // If search params have anythign except entry-detail-id
  const paramsEmpty = (): boolean => {
    const { 'entry-detail-id': _, ...rest } = Object.fromEntries(
      searchParams.entries()
    );

    if (Object.keys(rest).length > 0) return false;
    return true;
  };

  // submit input (search title)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // If there is input set it to params else delete it
    if (input) searchParams.set('title', input);
    else searchParams.delete('title');
    setSearchParams(searchParams);
  };

  // Handle input
  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Cler filter and reset input
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setInput('');
  };

  return (
    <div className='fixed left-16 z-20 top-0 right-0 h-16'>
      <div className='h-16 w-full flex items-center px-5 gap-2 text-darkGray dark:text-white bg-lightGray dark:bg-darkGray'>
        <form
          className='relative flex w-3/4 md:w-1/2 xl:w-1/4 items-center gap-2 text-darkGray dark:text-white'
          onSubmit={submit}
        >
          <input
            className={
              'p-2 border-2 w-full border-white dark:border-gray bg-white dark:bg-gray rounded-md focus:border-STUColor dark:focus:border-STUColor outline-none placeholder:text-gray dark:placeholder:text-lightGray'
            }
            type={'text'}
            name={'searchTitle'}
            value={input}
            placeholder={t('page.search')}
            onChange={handleSearchInput}
          />
          <button type='submit' className={'absolute right-2'}>
            <IoSearchOutline size={30} />
          </button>
        </form>
        {!paramsEmpty() && (
          <button
            className='text-black dark:text-white hover:text-red dark:hover:text-red'
            onClick={clearFilters}
          >
            <MdFilterAltOff size={30} />
          </button>
        )}
        <span className={'flex-1'}></span>

        {showFilterButton && (
          <button onClick={() => setIsFilterOpen((prevIsOpen) => !prevIsOpen)}>
            {isFilterOpen ? (
              <BsFilterSquareFill size={30} />
            ) : (
              <BsFilterSquare size={30} />
            )}
          </button>
        )}
        {isFilterOpen && <Filter />}
      </div>
    </div>
  );
};

export default SearchMenu;
