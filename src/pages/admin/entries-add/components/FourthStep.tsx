import { ChangeEvent, FormEvent } from 'react';
import ElviraTextarea from '../../../../components/common/ElviraTextarea';
import { useTranslation } from 'react-i18next';
import NextButton from './NextButton';
import PreviousButton from './PreviousButton';
import { IWizardParams } from '../../../../utils/interfaces/general/general';

const FourthStep = ({
  entryForm,
  setEntryForm,
  stepIndex,
  setStepIndex,
}: IWizardParams) => {
  const { t } = useTranslation();

  const handleSubmitStepFour = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex(stepIndex + 1);
  };

  const handleCitationChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      citation: event.target.value, // Update the citation property
    });
  };

  return (
    <form
      className='w-full h-full flex flex-col justify-start items-center gap-4'
      onSubmit={handleSubmitStepFour}
    >
      <span className='text-3xl font-extrabold '>
        {t('entry.wizard.citation')}
      </span>
      <ElviraTextarea
        onChange={handleCitationChange}
        placeholder={t('entry.wizard.citation')}
        value={entryForm.citation ?? ''}
      />

      <div className='w-full flex justify-end gap-4 pt-7'>
        <PreviousButton stepIndex={stepIndex} setStepIndex={setStepIndex} />
        <NextButton />
      </div>
    </form>
  );
};

export default FourthStep;
