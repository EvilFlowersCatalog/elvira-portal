import { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import ElviraInput from '../../../../components/common/ElviraInput';
import ElviraTextarea from '../../../../components/common/ElviraTextarea';
import PreviousButton from './PreviousButton';
import NextButton from './NextButton';
import { IWizardParams } from '../../../../utils/interfaces/general/general';

const SecondStep = ({
  entryForm,
  setEntryForm,
  stepIndex,
  setStepIndex,
}: IWizardParams) => {
  const { t } = useTranslation();

  const handleSubmitStepTwo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex(stepIndex + 1);
  };
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity(''); // reset invalidity
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      title: event.target.value, // Update the title property
    });
  };
  const handleYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      published_at: event.target.value, // Update the published_at property
    });
  };
  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    });
  };
  const handleSummaryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      summary: event.target.value, // Update the summary property
    });
  };

  return (
    <form
      className='w-full h-full flex flex-col justify-start items-center gap-4'
      onSubmit={handleSubmitStepTwo}
    >
      <span className='text-3xl font-extrabold '>
        {t('entry.wizard.additionalData')}
      </span>
      <ElviraInput
        onChange={handleTitleChange}
        invalidMessage={t('entry.wizard.requiredMessages.title')}
        required
        placeholder={t('entry.wizard.title')}
        value={entryForm.title}
      />
      <ElviraInput
        onChange={handleYearChange}
        placeholder={t('entry.wizard.year')}
        value={entryForm.published_at}
      />
      <ElviraInput
        onChange={handlePublisherChange}
        placeholder={t('entry.wizard.publisher')}
        value={entryForm.publisher}
      />
      <ElviraTextarea
        onChange={handleSummaryChange}
        placeholder={t('entry.wizard.summary')}
        value={entryForm.summary}
      />
      <div className='w-full flex justify-end gap-4 pt-7'>
        <PreviousButton stepIndex={stepIndex} setStepIndex={setStepIndex} />
        <NextButton />
      </div>
    </form>
  );
};

export default SecondStep;
