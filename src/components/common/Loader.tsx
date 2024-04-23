import { CircleLoader } from 'react-spinners';
import titleLogoLight from '../../assets/images/elvira-logo/title-logo-light.png';
import titleLogoDark from '../../assets/images/elvira-logo/title-logo-dark.png';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import useAppContenxt from '../../hooks/useAppContext';

/**
 * Returns Loader
 * @returns lodaer component used in login when user pressed log in and waiting for info from server
 */
const Loader = () => {
  const { theme, STUColor } = useAppContenxt();

  return (
    <div
      className={
        'fixed z-50 top-0 bottom-0 left-0 right-0 flex flex-col gap-10 justify-center items-center bg-white dark:bg-darkGray bg-opacity-95'
      }
    >
      <img
        className={'w-72 md:w-96'}
        src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
        alt='Elvira-title-logo'
      />
      <CircleLoader color={STUColor} size={90} />
    </div>
  );
};

export default Loader;
