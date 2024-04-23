import { useTranslation } from 'react-i18next';

const PageError = () => {
  const { t } = useTranslation();

  return (
    <div
      className={
        'w-full h-screen text-center flex flex-col gap-10 justify-center items-center text-5xl text-black dark:text-white font-bold'
      }
    >
      {t('page.error')}
    </div>
  );
};

export default PageError;
