import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useCookiesContext from '../../hooks/contexts/useCookiesContext';
import {
  COOKIES_TYPE,
  THEME_TYPE,
} from '../../utils/interfaces/general/general';
import Button from '../buttons/Button';

const CookiesInformation = () => {
  const { t } = useTranslation();
  const { theme, titleLogoLight, titleLogoDark } = useAppContext();
  const { setCookie, setInformed } = useCookiesContext();

  const handleAccept = () => {
    setInformed(true);
    setCookie(COOKIES_TYPE.INFOMED_KEY, true, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
  };

  return (
    <div className='fixed w-full bottom-5 max-md:bottom-0 flex justify-center z-50 pointer-events-none'>
      <div
        className={`flex flex-col max-w-[550px] min-w-64 m-auto bg-white dark:bg-black bg-opacity-90 dark:bg-opacity-90 text-black dark:text-white p-4 gap-5 md:rounded-md pointer-events-auto`}
      >
        <div className='flex w-full justify-center items-center'>
          <img
            className='w-52'
            src={theme === THEME_TYPE.dark ? titleLogoLight : titleLogoDark}
            alt='Elvira Logo'
          />
        </div>
        <span className='text-sm text-center'>{t('cookies.information')}</span>
        <div className='w-full flex justify-center'>
          <Button onClick={handleAccept}>
            {t('cookies.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookiesInformation;
