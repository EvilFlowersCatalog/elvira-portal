import { FiMenu } from 'react-icons/fi';
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
    stuLogoDark,
    stuLogoLight,
    specialNavigation,
  } = useAppContext();

  return (
    <div className='fixed z-20 top-0 w-full flex px-5 gap-4 items-center h-14 bg-zinc-200 dark:bg-darkGray'>
      <button className='' onClick={() => setShowNavbar(true)}>
        <FiMenu size={30} />
      </button>

      <button onClick={(e) => specialNavigation(e, NAVIGATION_PATHS.home)}>
        <img
          className='h-auto w-32 min-w-24'
          src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
          alt='Elvira Logo'
        />
      </button>

      {/* Spacer */}
      <span className='flex-1' />

      <img
        className='h-auto w-16 min-w-12'
        src={theme === THEME_TYPE.dark ? stuLogoLight : stuLogoDark}
        alt='STU Logo'
      />
    </div>
  );
};

export default Header;
