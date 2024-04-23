import { useTranslation } from 'react-i18next';

const applyInfo = () => {
  const { t } = useTranslation();

  return (
    <span className='text-xl text-black dark:text-white'>
      {t('modal.applyInfo.dialog')}
    </span>
  );
};

export default applyInfo;
