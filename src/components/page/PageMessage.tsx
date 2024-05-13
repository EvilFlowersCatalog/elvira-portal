import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import { THEME_TYPE } from '../../utils/interfaces/general/general';
import Button from '../common/Button';

interface IPageMessageParams {
  message: string;
  clearParams?: (() => void) | null;
}

const PageMessage = ({ message, clearParams = null }: IPageMessageParams) => {
  const { theme, logoDark, logoLight } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className='flex flex-1 flex-col px-4 items-center justify-center text-center p-4'>
      <img
        className='w-20 mb-10'
        src={theme === THEME_TYPE.dark ? logoLight : logoDark}
        alt='Elvira Small Logo'
      />
      <span className='text-[30px] md:text-[50px] font-extrabold uppercase'>
        {message}
      </span>
      {clearParams && (
        <Button onClick={clearParams}>
          <span>{t('page.removeFilters')}</span>
        </Button>
      )}
    </div>
  );
};

export default PageMessage;
