import { FiMenu } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import titleLogoDark from '../../assets/images/elvira-logo/title-logo-dark.png';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import stuTitleDark from '../../assets/images/stu/title/stu-title-dark.png';
import stuTitleLight from '../../assets/images/stu/title/stu-title-light.png';

const Header = () => {
  const { setShowMenu, theme } = useAppContext();

  return (
    <div className='flex px-5 gap-5 items-center h-14 bg-zinc-200 dark:bg-darkGray'>
      <button className='' onClick={() => setShowMenu(true)}>
        <FiMenu size={30} />
      </button>

      <img
        className='h-auto w-28'
        src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
      />

      {/* Spacer */}
      <span className='flex-1' />

      <img
        className='h-auto w-7'
        src={theme === THEME_TYPE.dark ? stuTitleLight : stuTitleDark}
      />
    </div>
  );
};

export default Header;
