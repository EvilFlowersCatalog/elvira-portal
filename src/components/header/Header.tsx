import { FiMenu } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';

const Header = () => {
  const {
    setShowNavbar,
    theme,
    titleLogoDark,
    titleLogoLight,
    specialNavigation,
  } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='fixed left-0 top-0 z-30 w-full h-fit py-3 flex px-5 gap-4 items-center bg-white dark:bg-zinc-800'>
      <button
        aria-label={t('navbar.openMenu', { defaultValue: 'Open menu' })}
        onClick={() => setShowNavbar(true)}
      >
        <FiMenu size={30} aria-hidden="true" />
      </button>

      {/* Spacer */}
      <span className='flex-1' />

      <button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.home)}>
        <img
          className='h-auto w-32'
          src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          alt='Elvira Logo'
        />
      </button>
    </div>
  );
};

export default Header;
