import { useTranslation } from 'react-i18next';

interface IPreviousButtonParams {
  stepIndex: number;
  setStepIndex: (stepIndex: number) => void;
}

const PreviousButton = ({ setStepIndex, stepIndex }: IPreviousButtonParams) => {
  const { t } = useTranslation();

  return (
    <button
      className='hover:underline'
      onClick={() => setStepIndex(stepIndex - 1)}
    >
      {t('entry.wizard.previous')}
    </button>
  );
};

export default PreviousButton;
