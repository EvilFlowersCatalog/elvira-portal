import { FiMenu } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';

const Header = () => {
  const {
    setShowNavbar,
    theme,
    titleLogoDark,
    titleLogoLight,
    stuLogoDark,
    stuLogoLight,
  } = useAppContext();

  return (
    <div className='fixed z-20 top-0 w-full min-w-32 flex px-5 gap-5 items-center h-14 bg-zinc-200 dark:bg-darkGray overflow-auto'>
      <button className='' onClick={() => setShowNavbar(true)}>
        <FiMenu size={30} />
      </button>

      <img
        className='h-auto w-32 min-w-24'
        src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
      />

      {/* Spacer */}
      <span className='flex-1' />

      <img
        className='h-auto w-16 min-w-12'
        src={theme === THEME_TYPE.dark ? stuLogoLight : stuLogoDark}
      />
    </div>
  );
};

export default Header;
