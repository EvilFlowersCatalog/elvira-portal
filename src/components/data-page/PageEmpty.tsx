import { useTranslation } from 'react-i18next';
import { GrPowerReset } from 'react-icons/gr';
import { useSearchParams } from 'react-router-dom';

const PageEmpty = () => {
  const { t } = useTranslation();
  const [_, setSearchParams] = useSearchParams();

  return (
    <div
      className={
        'w-full h-screen text-center flex flex-col gap-10 justify-center items-center text-5xl text-black dark:text-white font-bold'
      }
    >
      {t('page.empty')}
      <button
        className={'hover:scale-110 duration-200 hover:text-blue'}
        onClick={() => setSearchParams(new URLSearchParams())}
      >
        <GrPowerReset />
      </button>
    </div>
  );
};

export default PageEmpty;
