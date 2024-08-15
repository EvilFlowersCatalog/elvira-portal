import { ChangeEvent, FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ElviraInput from '../../../../components/common/ElviraInput';
import ElviraTextarea from '../../../../components/common/ElviraTextarea';
import PreviousButton from './PreviousButton';
import NextButton from './NextButton';
import { IWizardParams } from '../../../../utils/interfaces/general/general';
import useCustomEffect from '../../../../hooks/useCustomEffect';
import ElviraSelect from '../../../../components/common/ElviraSelect';

const SecondStep = ({
  entryForm,
  setEntryForm,
  stepIndex,
  setStepIndex,
}: IWizardParams) => {
  const { t } = useTranslation();

  const year = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<string>('YYYY');
  const [selectedMonth, setSelectedMonth] = useState<string>('MM');
  const [selectedDay, setSelectedDay] = useState<string>('DD');
  const [maxDay, setMaxDay] = useState<number>(31);

  // when month change change possible day (30;31;28/29)
  useCustomEffect(() => {
    if (selectedMonth !== 'MM') {
      if (['1', '3', '5', '7', '8', '10', '12'].includes(selectedMonth)) {
        setMaxDay(31);
      } else if (selectedMonth == '2') {
        // when its february
        if (selectedYear !== 'YYYY') {
          const numYear = parseInt(selectedYear);
          if (
            (numYear % 4 === 0 && numYear % 100 !== 0) ||
            numYear % 400 === 0
          ) {
            setMaxDay(29); // Leap year, February has 29 days
          } else {
            setMaxDay(28); // Non-leap year, February has 28 days
          }
        }
      } else setMaxDay(30);
    }
  }, [selectedMonth, selectedYear]);

  useCustomEffect(() => {
    if (
      selectedYear !== 'YYYY' &&
      selectedMonth !== 'MM' &&
      selectedDay !== 'DD'
    ) {
      setEntryForm({
        ...entryForm,
        published_at: `${selectedYear}-${selectedMonth}-${selectedDay}`,
      });
    } else if (selectedYear !== 'YYYY' && selectedMonth !== 'MM') {
      setEntryForm({
        ...entryForm,
        published_at: `${selectedYear}-${selectedMonth}`,
      });
    } else if (selectedYear !== 'YYYY') {
      setEntryForm({
        ...entryForm,
        published_at: `${selectedYear}`,
      });
    } else {
      setEntryForm({
        ...entryForm,
        published_at: '',
      });
    }
  }, [selectedDay, selectedMonth, selectedYear]);

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
  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    });
  };
  const handleLanguageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      language_code: event.target.value.toLocaleUpperCase(), // Update the publisher property
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
        onChange={handlePublisherChange}
        placeholder={t('entry.wizard.publisher')}
        value={entryForm.publisher}
      />
      <ElviraInput
        onChange={handleLanguageChange}
        placeholder={t('entry.wizard.lang')}
        value={entryForm.language_code ?? ''}
      />
      <div className='flex flex-col gap-4 w-full'>
        <span>{t('entry.wizard.year')}</span>
        <div className='w-fit flex gap-4'>
          <ElviraSelect
            name='date-year'
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value='YYYY'>YYYY</option>
            {Array.from({
              length: year - 1900,
            }).map((_, i) => (
              <option key={i} value={(year - i).toString()}>
                {year - i}
              </option>
            ))}
          </ElviraSelect>
          {selectedYear !== 'YYYY' && (
            <ElviraSelect
              name='date-month'
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value='MM'>MM</option>
              {Array.from({
                length: 12,
              }).map((_, i) => (
                <option key={i} value={(i + 1).toString()}>
                  {i + 1}
                </option>
              ))}
            </ElviraSelect>
          )}
          {selectedMonth !== 'MM' && selectedYear !== 'YYYY' && (
            <ElviraSelect
              name='date-day'
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value='DD'>DD</option>
              {Array.from({
                length: maxDay,
              }).map((_, i) => (
                <option key={i} value={(i + 1).toString()}>
                  {i + 1}
                </option>
              ))}
            </ElviraSelect>
          )}
        </div>
      </div>
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
