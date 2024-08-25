import { ChangeEvent, FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoAddCircle, IoRemoveCircle } from 'react-icons/io5';
import { MdRemoveCircle } from 'react-icons/md';
import FeedMenu from '../../../../../components/common/FeedMenu';
import NextButton from '../NextButton';
import PreviousButton from '../PreviousButton';
import useCustomEffect from '../../../../../hooks/useCustomEffect';
import { IWizardParams } from '../../../../../utils/interfaces/general/general';
import ElviraInput from '../../../../../components/inputs/ElviraInput';
import AuthorsAutofill from '../../../../../components/inputs/AuthorsAutofill';
import useGetAuthors from '../../../../../hooks/api/authors/useGetAuthors';
import { IEntryAuthor } from '../../../../../utils/interfaces/author';
import PageLoading from '../../../../../components/page/PageLoading';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authors, setAuthors] = useState<IEntryAuthor[]>([]);

  const getAuthors = useGetAuthors();

  useCustomEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { items: a } = await getAuthors({ paginate: false });
        setAuthors(a);
      } catch {
        setAuthors([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

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
  // Contribtors add/remove handlers
  const handleAddAuthor = () => {
    setEntryForm({
      ...entryForm,
      authors: [...entryForm.authors, { name: '', surname: '' }],
    });
  };

  const removeAuthor = (i: number) => {
    const authors = entryForm!.authors.filter((_, index) => index !== i);
    setEntryForm({
      ...entryForm,
      authors: authors,
    });
  };

  return (
    <>
      {isLoading ? (
        <div className='w-full h-full'>
          <PageLoading />
        </div>
      ) : (
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
                  onClick={handleAddAuthor}
                  type='button'
                >
                  <IoAddCircle size={30} />
                </button>
              </div>

              {/* Author */}
              <div className='flex flex-col gap-4 w-full'>
                {entryForm.authors?.map((_, index) => (
                  <div className='flex w-full gap-4 items-start' key={index}>
                    <AuthorsAutofill
                      entryForm={entryForm}
                      setEntryForm={setEntryForm}
                      index={index}
                      authors={authors}
                      type='name'
                    />
                    <AuthorsAutofill
                      entryForm={entryForm}
                      setEntryForm={setEntryForm}
                      index={index}
                      authors={authors}
                      type='surname'
                    />
                    {index !== 0 && (
                      <IoRemoveCircle
                        color='red'
                        size={40}
                        className='cursor-pointer pt-1'
                        onClick={() => removeAuthor(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Feeds */}
            <div className='flex flex-col flex-1 justify-start items-center gap-4 mt-4 rounded-md'>
              {/* Feeds header */}
              <div className='flex w-full justify-center items-center gap-4 text-STUColor'>
                <span className='text-xl font-bold'>
                  {t('entry.wizard.feeds')}
                </span>
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
      )}
    </>
  );
};

export default ThirdStep;
