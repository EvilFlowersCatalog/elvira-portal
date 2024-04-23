import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoClose, IoMenu, IoSearchOutline } from 'react-icons/io5';
import { ChangeEvent, FormEvent, useState } from 'react';
import NavbarMenu from './menu/NavbarMenu';
import { BsFilterSquare, BsFilterSquareFill } from 'react-icons/bs';
import Filter from './menu/Filter';
import { MdFilterAltOff } from 'react-icons/md';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import stuTitleLight from '../../assets/images/stu/title/stu-title-light.png';
import useAppContext from '../../hooks/useAppContext';
import { useTranslation } from 'react-i18next';
import { IoMdCloseCircle } from 'react-icons/io';

/**
 * Return MobileNavbar
 * @returns custom mobile navbar for mobile
 */
const MobileNavbar = () => {
  const { isSearchNeeded } = useAppContext();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const navigate = useNavigate();

  // If search params have anythign except entry-detail-id
  const paramsEmpty = (): boolean => {
    const { 'entry-detail-id': _, ...rest } = Object.fromEntries(
      searchParams.entries()
    );

    if (Object.keys(rest).length > 0) return false;
    return true;
  };

  // Cler filter and reset input
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setInput('');
  };

  // Mobile click so it will navigate to tha path and hide the menu
  const handleMobileButtonClick = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
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

  return (
    <header className='fixed top-0 w-full h-28 flex flex-col gap-2 z-20 px-5 py-2 text-white bg-darkGray'>
      {/* Upper row */}
      <div className='flex h-1/2 justify-between gap-5'>
        {/* Elvira logo */}
        <button
          className={'w-40'}
          onClick={() => handleMobileButtonClick(NAVIGATION_PATHS.home)}
        >
          <img src={titleLogoLight} />
        </button>

        {/* STU logo */}
        <button
          className={'w-8'}
          onClick={() => window.open('https://www.fiit.stuba.sk/', '_blank')}
        >
          <img src={stuTitleLight} />
        </button>
      </div>

      {/* Bottom row */}
      <div className='flex h-1/2 gap-5'>
        {/* Menu button */}
        <button onClick={() => setIsMenuOpen((prevIsOpen) => !prevIsOpen)}>
          {isMenuOpen ? <IoClose size={30} /> : <IoMenu size={30} />}
        </button>

        {/* Spacer */}
        <span className={'flex-1'}></span>

        {isSearchNeeded() &&
          (!showSearch ? (
            <>
              {/* Search */}
              <button onClick={() => setShowSearch(true)}>
                <IoSearchOutline size={30} />
              </button>

              {/* Filter */}
              <button
                onClick={() => setIsFilterOpen((prevIsOpen) => !prevIsOpen)}
              >
                {isFilterOpen ? (
                  <BsFilterSquareFill size={30} />
                ) : (
                  <BsFilterSquare size={30} />
                )}
              </button>

              {/* If there are active filters remove filters button */}
              {!paramsEmpty() && (
                <button
                  className='text-white hover:text-red dark:hover:text-red'
                  onClick={clearFilters}
                >
                  <MdFilterAltOff size={30} />
                </button>
              )}
            </>
          ) : (
            <>
              <form
                className='relative flex w-full items-center gap-2 text-darkGray dark:text-white'
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
              <button onClick={() => setShowSearch(false)}>
                <IoMdCloseCircle size={20} />
              </button>
            </>
          ))}
      </div>

      {isFilterOpen && <Filter />}
      {isMenuOpen && (
        <div
          className={
            'fixed z-50 top-28 left-0 bottom-0 w-screen bg-darkGray overflow-auto'
          }
        >
          <NavbarMenu isMobile setOpen={setIsMenuOpen} />
        </div>
      )}
    </header>
  );
};

export default MobileNavbar;
