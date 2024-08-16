import { ChangeEvent, FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoAddCircle } from 'react-icons/io5';
import ElviraInput from '../../../../../components/common/ElviraInput';
import { MdRemoveCircle } from 'react-icons/md';
import FeedMenu from '../../../../../components/feeds/FeedMenu';
import NextButton from '../NextButton';
import PreviousButton from '../PreviousButton';
import useCustomEffect from '../../../../../hooks/useCustomEffect';
import { IWizardParams } from '../../../../../utils/interfaces/general/general';

const ThirdStep = ({
  entryForm,
  setEntryForm,
  stepIndex,
  setStepIndex,
}: IWizardParams) => {
  const { t } = useTranslation();

  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >(entryForm.feeds ?? []);

  // feed add/remove handlers
  useCustomEffect(() => {
    setEntryForm({
      ...entryForm,
      feeds: activeFeeds.map((feed) => ({ title: feed.title, id: feed.id })),
    });
  }, [activeFeeds]);

  const handleSubmitStepThree = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex(stepIndex + 1);
  };
  const handleAuthorNameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.target.setCustomValidity('');
    const updatedAuthors = entryForm.authors;
    updatedAuthors[index].name = event.target.value;

    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    });
  };
  const handleAuthorSurnameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.target.setCustomValidity('');
    const updatedAuthors = entryForm.authors;
    updatedAuthors[index].surname = event.target.value;

    setEntryForm({
      ...entryForm, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    });
  };
  // Contribtors add/remove handlers
  const handleAddContributor = () => {
    setEntryForm({
      ...entryForm,
      authors: [...entryForm.authors, { name: '', surname: '' }],
    });
  };
  const handleRemoveContributor = (index: number) => {
    const updatedAuthors = [...entryForm.authors];
    updatedAuthors.splice(index, 1);
    setEntryForm({ ...entryForm, authors: updatedAuthors });
  };

  return (
    <form
      className='w-full h-full flex flex-col justify-start items-center gap-4'
      onSubmit={handleSubmitStepThree}
    >
      <span className='text-3xl font-extrabold '>
        {t('entry.wizard.AuthorsAndFeeds')}
      </span>
      <div className='flex flex-col justify-between w-full h-full gap-4'>
        {/* Authors */}
        <div className='flex flex-2 flex-col justify-start items-center gap-4'>
          {/* Authors header */}
          <div className='flex w-full justify-center items-center gap-4 text-STUColor'>
            <span className='text-xl font-bold'>
              {t('entry.wizard.author')}
            </span>
            <button
              className='hover:text-darkGray dark:hover:text-white'
              onClick={handleAddContributor}
              type='button'
            >
              <IoAddCircle size={30} />
            </button>
          </div>

          {/* Author */}
          <div className='flex w-full gap-4'>
            <ElviraInput
              onChange={(e) => handleAuthorNameChange(0, e)}
              invalidMessage={t('entry.wizard.requiredMessages.authorName')}
              placeholder={t('entry.wizard.authorName')}
              required
              value={entryForm.authors[0]?.name}
            />

            <span className='w-6'></span>

            <ElviraInput
              onChange={(e) => handleAuthorSurnameChange(0, e)}
              invalidMessage={t('entry.wizard.requiredMessages.authorSurname')}
              placeholder={t('entry.wizard.authorSurname')}
              required
              value={entryForm.authors[0]?.surname}
            />
          </div>

          {/* Contributors */}
          <div className='flex flex-col gap-2 w-full'>
            {entryForm.authors.slice(1).map((_, index) => (
              <div key={index} className='flex w-full items-start gap-4'>
                <ElviraInput
                  required
                  placeholder={t('entry.wizard.coName')}
                  onChange={(e) => handleAuthorNameChange(index + 1, e)}
                  invalidMessage={t('entry.wizard.requiredMessages.coName')}
                  value={entryForm.authors[index + 1].name}
                />

                <span className='w-6'></span>

                <ElviraInput
                  required
                  placeholder={t('entry.wizard.coSurname')}
                  onChange={(e) => handleAuthorSurnameChange(index + 1, e)}
                  invalidMessage={t('entry.wizard.requiredMessages.coSurname')}
                  value={entryForm.authors[index + 1].surname}
                />

                <button
                  className='text-red h-fit mt-2'
                  onClick={() => handleRemoveContributor(index + 1)}
                  type='button'
                >
                  <MdRemoveCircle size={30} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feeds */}
        <div className='flex flex-col flex-1 justify-start items-center gap-4 mt-4 rounded-md'>
          {/* Feeds header */}
          <div className='flex w-full justify-center items-center gap-4 text-STUColor'>
            <span className='text-xl font-bold'>{t('entry.wizard.feeds')}</span>
          </div>

          {/* Feeds contianer*/}
          <div className='flex flex-col w-full min-h-72'>
            <FeedMenu
              activeFeeds={activeFeeds}
              setActiveFeeds={setActiveFeeds}
            />
          </div>
        </div>
      </div>
      <div className='w-full flex justify-end gap-4 pt-7'>
        <PreviousButton stepIndex={stepIndex} setStepIndex={setStepIndex} />
        <NextButton />
      </div>
    </form>
  );
};

export default ThirdStep;
