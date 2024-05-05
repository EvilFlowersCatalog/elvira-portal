import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import titleLogoLight from '../assets/images/elvira-logo/title-logo-light.png';
import titleLogoDark from '../assets/images/elvira-logo/title-logo-dark.png';
import {
  NAVIGATION_PATHS,
  THEME_TYPE,
} from '../utils/interfaces/general/general';
import Button from '../components/common/Button';
import useAppContext from '../hooks/contexts/useAppContext';

/**
 * Returns NotFoundPage
 * @returns not found page, when user goes somewhere where he should not
 */
const NotFound = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={'flex flex-1 flex-col justify-center items-center gap-5'}>
      <img
        className={'w-3/5 md:w-2/5'}
        src={theme === THEME_TYPE.light ? titleLogoDark : titleLogoLight}
      />
      <h1 className={'text-[100px] md:text-[200px] font-bold text-STUColor'}>
        {t('notFound.oops')}
      </h1>
      <p className={'text-2xl md:text-4xl text-center text-bold font-bold'}>
        {t('notFound.404')}
      </p>
      <div className={'text-center flex flex-col'}>
        <span>{t('notFound.infoPart1')}</span>
        <span>{t('notFound.infoPart2')}</span>
      </div>
      <Button onClick={() => navigate(NAVIGATION_PATHS.home)}>
        <span>{t('notFound.goBack')}</span>
      </Button>
    </div>
  );
};

export default NotFound;
