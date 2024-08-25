import { useTranslation } from 'react-i18next';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../../../utils/interfaces/general/general';
import ElviraInput from '../../../../components/inputs/ElviraInput';
import { IoSearchOutline } from 'react-icons/io5';

const HomeHeader = () => {
  const { t } = useTranslation();
  const { theme, titleLogoDark, titleLogoLight } = useAppContext();
  const [searchInput, setSearchInput] = useState<string>('');

  const navigate = useNavigate();

  // input handler
  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // submit handler
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // prevent

    // set new params
    const params = new URLSearchParams();
    if (searchInput) {
      params.set('query', searchInput);

      // navigate and search
      navigate({
        pathname: NAVIGATION_PATHS.library,
        search: params.toString(),
      });
    }
  };

  return (
    <div className='flex items-center flex-col gap-5 py-12'>
      <img
        className='w-full md:w-1/4'
        src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
        alt='Elvira Logo'
      />
      <div className='text-center'>
        <p className='text-2xl font-extrabold'>{t('about.title')}</p>
        <p>{t('about.subTitle')}</p>
      </div>

      <form
        className='relative flex w-full md:w-1/2 xl:w-1/3 max-w-96 items-center gap-2 text-darkGray dark:text-white'
        onSubmit={submit}
      >
        <ElviraInput
          type={'text'}
          value={searchInput}
          placeholder={t('home.search')}
          onChange={handleSearchInput}
          backgroundTailwind='bg-zinc-200 dark:bg-darkGray'
        />
        <button type='submit' className={'absolute right-2 top-2.5'}>
          <IoSearchOutline size={25} />
        </button>
      </form>
    </div>
  );
};

export default HomeHeader;
