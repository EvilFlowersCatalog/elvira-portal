import { useTranslation } from 'react-i18next';

const NextButton = ({ end = false }) => {
  const { t } = useTranslation();

  return (
    <button
      className='py-2 px-5 font-bold hover:text-black dark:hover:text-white bg-STUColor hover:bg-opacity-50 text-white rounded-md duration-200'
      type='submit'
    >
      {end ? t('entry.wizard.upload') : t('entry.wizard.next')}
    </button>
  );
};

export default NextButton;
