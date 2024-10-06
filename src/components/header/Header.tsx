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
    specialNavigation,
  } = useAppContext();

  return (
    <div className='fixed top-0 z-20 w-full h-fit py-3 flex px-5 gap-4 items-center bg-zinc-200 dark:bg-darkGray'>
      <button className='' onClick={() => setShowNavbar(true)}>
        <FiMenu size={30} />
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
