import {
  ChangeEvent,
  FormEvent,
  InvalidEvent,
  useEffect,
  useState,
} from 'react';
import {
  IEntryDetail,
  IEntryInfo,
  IEntryNew,
  IEntryNewForm,
} from '../../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IoAddCircle } from 'react-icons/io5';
import { MdRemoveCircle } from 'react-icons/md';
import CustomInput from '../../../common/CustomInput';
import CustomTextArea from '../../../common/CustomTextArea';
import ModalWrapper from '../../../modal/ModalWrapper';
import { IFeed } from '../../../../utils/interfaces/feed';
import useGetFeeds from '../../../../hooks/api/feeds/useGetFeeds';
import { toast } from 'react-toastify';
import FeedMenu from './FeedMenu';
import Dropzone from '../../../common/Dropzone';
import { getBase64 } from '../../../../assets/func/functions';
import useUploadEntry from '../../../../hooks/api/entries/useUploadEntry';
import useEditEntry from '../../../../hooks/api/entries/useEditEntry';
import {
  IDENTIFIERS_TYPE,
  NAVIGATION_PATHS,
} from '../../../../utils/interfaces/general/general';
import useGetData from '../../../../hooks/api/identifiers/useGetData';
import PageLoading from '../../PageLoading';
import ApplyInfo from '../../../common/dialogs/ApplyInfo';

interface IEntryWizardParams {
  form?: IEntryDetail;
  edit?: boolean;
}
const EntryWizard = ({ form, edit = false }: IEntryWizardParams) => {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openFeeds, setOpenFeeds] = useState<boolean>(false);
  const [openApplyInfo, setOpenApplyInfo] = useState<boolean>(false);
  const [entryInfo, setEntryInfo] = useState<IEntryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >(
    (form?.response.feeds ?? []).map((feed) => ({
      title: feed.title,
      id: feed.id,
    }))
  );
  const getFeeds = useGetFeeds();
  const uploadEntry = useUploadEntry();
  const editEntry = useEditEntry();
  const navigate = useNavigate();
  const getData = useGetData();

  const NextButton = ({ end = false }) => {
    return (
      <button
        className='py-2 px-5 font-bold hover:text-STUColor bg-STUColor hover:bg-opacity-0 text-white rounded-md duration-200'
        type='submit'
      >
        {end
          ? edit
            ? t('entry.wizard.edit')
            : t('entry.wizard.upload')
          : t('entry.wizard.next')}
      </button>
    );
  };
  const PreviousButton = () => {
    return (
      <button
        className='text-lightGray dark:text-darkGray hover:text-black dark:hover:text-white hover:underline'
        onClick={() => {
          searchParams.set('step', `${stepIndex - 1}`);
          setSearchParams(searchParams);
        }}
      >
        {t('entry.wizard.previous')}
      </button>
    );
  };

  // Get image type
  const getImageType = (base64Image: string): string => {
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,/);
    if (matches && matches.length === 2) {
      return matches[1]; // The image type (e.g., 'jpeg' or 'png')
    } else {
      // Default to 'jpeg' if the image type can't be determined
      return 'jpeg';
    }
  };

  // Convert base64 to image file
  const convertToImageFile = (base64?: string): File | null => {
    if (!base64) return null;
    const imageType = getImageType(base64); // get image type
    // replace first info, (cuz it will pass the atob func)
    const base64WithoutPrefix = base64.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ''
    );
    // encode
    const byteCharacters = atob(base64WithoutPrefix);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: `image/${imageType}` }); // create Blob
    // Return image
    return new File([blob], 'Picture', {
      type: `image/${imageType}`,
    });
  };

  const [entryForm, setEntryForm] = useState<IEntryNewForm>({
    title: form?.response.title ?? '',
    authors: form?.response.authors ?? [{ name: '', surname: '' }],
    feeds: (form?.response.feeds ?? []).map((feed) => ({
      id: feed.id,
      title: feed.title,
    })),
    summary: form?.response.summary ?? '',
    language_code: 'sk',
    identifiers: {
      doi: form?.response.identifiers.doi ?? '',
      isbn: form?.response.identifiers.isbn ?? '',
    },
    citation: form?.response.citation ?? '',
    year: form?.response.year ?? '',
    publisher: form?.response.publisher ?? '',
    image: convertToImageFile(form?.response.thumbnail),
    pdf: null,
  });

  // at begin set stepindex to 0
  useEffect(() => {
    searchParams.set('step', '0');
    setSearchParams(searchParams);
  }, []);

  // When searchParams changed set new stepIndex
  useEffect(() => {
    const index = searchParams.get('step'); // get index
    if (index) {
      const intIndex = parseInt(index);
      setStepIndex(intIndex);
    } else setStepIndex(0);
  }, [searchParams]);

  // Handlers for submiting in steps
  const handleSubmitStepOne = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // if there is some identifier
      if (entryForm.identifiers.doi || entryForm.identifiers.isbn) {
        // set loading
        setIsLoading(true);

        // get info from endpoint
        const givenEntryInfo = await getData(
          IDENTIFIERS_TYPE.doi,
          entryForm.identifiers.doi
        );

        // If succes save
        setEntryInfo(givenEntryInfo);

        // Notify and open apply info dialog
        toast.success(t('notifications.dataFromIdentifiers.success'));
        setOpenApplyInfo(true);
      }
    } catch {
      // Notify about error
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      // Whatever happens go to next step and set loading to false
      setIsLoading(false);
      searchParams.set('step', '1');
      setSearchParams(searchParams);
    }
  };
  const handleSubmitStepTwo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    searchParams.set('step', '2');
    setSearchParams(searchParams);
  };
  const handleSubmitStepThree = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    searchParams.set('step', '3');
    setSearchParams(searchParams);
  };
  const handleSubmitStepFour = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    searchParams.set('step', '4');
    setSearchParams(searchParams);
  };
  const handleSubmitStepFive = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const entry: IEntryNew = {
      title: entryForm.title,
      authors: entryForm.authors,
      feeds: entryForm.feeds.map((feed) => {
        return feed.id;
      }),
      summary: entryForm.summary,
      language_code: 'sk',
      identifiers: {
        doi: entryForm.identifiers.doi,
        isbn: entryForm.identifiers.isbn,
      },
      citation: entryForm.citation,
      year: entryForm.year,
      publisher: entryForm.publisher,
      image: await getBase64(entryForm.image),
    };
    const pdf = await getBase64(entryForm.pdf);
    if (!entry.image) {
      // If there is no image notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.image'));
    }
    // EDIT
    else if (edit && form) {
      // update existing entry
      try {
        await editEntry(form.response.id, entry);
        toast.success(t('notifications.entry.edit.success'));
      } catch {
        toast.error(t('notifications.entry.edit.error'));
      } finally {
        navigate(NAVIGATION_PATHS.adminEntries, { replace: true });
      }
    }
    // UPLOAD
    else {
      if (!pdf) {
        // If there is no pdf notify that it is needed
        toast.warning(t('entry.wizard.requiredMessages.pdf'));
        return;
      }
      // Upload
      try {
        await uploadEntry(entry);
        toast.success(t('notifications.entry.add.success'));
      } catch {
        toast.error(t('notifications.entry.add.error'));
      } finally {
        navigate(NAVIGATION_PATHS.adminEntries, { replace: true });
      }
    }
  };

  // Handlers for inputs in steps
  const handleDOIChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      identifiers: {
        ...prevForm.identifiers, // Preserve existing properties of identifiers
        doi: event.target.value, // Update the doi property
      },
    }));
  };
  const handleISBNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      identifiers: {
        ...prevForm.identifiers, // Preserve existing properties of identifiers
        isbn: event.target.value, // Update the isbn property
      },
    }));
  };
  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity(''); // reset invalidity
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      title: event.target.value, // Update the title property
    }));
  };
  const handleTitleInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.title'));
  };
  const handleYearChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      year: event.target.value, // Update the year property
    }));
  };
  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    }));
  };
  const handleSummaryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      summary: event.target.value, // Update the summary property
    }));
  };
  const handleCitationChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      citation: event.target.value, // Update the citation property
    }));
  };
  const handleAuthorNameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    console.log(index);
    event.target.setCustomValidity('');
    const updatedAuthors = entryForm.authors;
    updatedAuthors[index].name = event.target.value;

    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    }));
  };
  const handleAuthorSurnameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.target.setCustomValidity('');
    const updatedAuthors = entryForm.authors;
    updatedAuthors[index].surname = event.target.value;

    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    }));
  };
  const handleAuthorNameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.authorName'));
  };
  const handleAuthorSurnameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(
      t('entry.wizard.requiredMessages.authorSurname')
    );
  };
  const handleContributorNameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.coName'));
  };
  const handleContributorSurnameInvalid = (
    e: InvalidEvent<HTMLInputElement>
  ) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.coSurname'));
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

  const handleOpenFeedWrapper = async () => {
    setOpenFeeds(true);
    setIsLoading(true);

    try {
      const { items: acquistionFeeds } = await getFeeds({
        page: 1,
        limit: 500,
        kind: 'acquisition',
      });

      setFeeds(acquistionFeeds);
    } catch {
      setOpenFeeds(false);
    } finally {
      setIsLoading(false);
    }
  };
  // feed add/remove handlers
  const handleAddFeeds = () => {
    setEntryForm({
      ...entryForm,
      feeds: activeFeeds.map((feed) => ({ title: feed.title, id: feed.id })),
    });
    setOpenFeeds(false);
  };
  const handleApplyInfo = () => {
    setOpenApplyInfo(false);
  };
  const handleRemoveFeed = (index: number) => {
    const updatedFeeds = [...entryForm.feeds];
    updatedFeeds.splice(index, 1);
    setEntryForm({ ...entryForm, feeds: updatedFeeds });
    setActiveFeeds(updatedFeeds);
  };

  // Handler for files
  const handleSetImage = (file: File | null) => {
    setEntryForm((prevForm) => ({
      ...prevForm,
      image: file,
    }));
  };

  const handleSetPDF = (file: File | null) => {
    setEntryForm((prevForm) => ({
      ...prevForm,
      pdf: file,
    }));
  };

  return (
    <div className='main-body-without-search flex justify-center items-center overflow-auto'>
      <div className='w-1/3 h-5/6 flex flex-col justify-center items-center gap-5'>
        <span className='text-3xl text-darkGray dark:text-white font-extrabold '>
          {stepIndex === 0 && t('entry.wizard.identifiers')}
          {stepIndex === 1 && t('entry.wizard.additionalData')}
          {stepIndex === 2 && t('entry.wizard.AuthorsAndFeeds')}
          {stepIndex === 3 && t('entry.wizard.citation')}
          {stepIndex === 4 &&
            (edit ? t('entry.wizard.image') : t('entry.wizard.imageAndFile'))}
        </span>

        {/* Step 1: DOI & ISBN */}
        {stepIndex === 0 &&
          (isLoading ? (
            <PageLoading />
          ) : (
            <form
              className='w-full h-full py-5 flex flex-col justify-start items-center rounded-md gap-5'
              onSubmit={handleSubmitStepOne}
            >
              <CustomInput
                onChange={handleDOIChange}
                placeholder='DOI'
                value={entryForm.identifiers.doi}
              />
              <CustomInput
                onChange={handleISBNChange}
                placeholder='ISBN'
                value={entryForm.identifiers.isbn}
              />
              <div className='w-full flex justify-end'>
                <NextButton />
              </div>
            </form>
          ))}

        {/* Step 2: ADDITIONAL DATA */}
        {stepIndex === 1 && (
          <form
            className='w-full h-full py-5 flex flex-col justify-start items-center rounded-md gap-5'
            onSubmit={handleSubmitStepTwo}
          >
            <CustomInput
              onChange={handleTitleChange}
              onInvalid={handleTitleInvalid}
              required
              placeholder={t('entry.wizard.title')}
              value={entryForm.title}
            />
            <CustomInput
              onChange={handleYearChange}
              placeholder={t('entry.wizard.year')}
              value={entryForm.year}
            />
            <CustomInput
              onChange={handlePublisherChange}
              placeholder={t('entry.wizard.publisher')}
              value={entryForm.publisher}
            />
            <CustomTextArea
              onChange={handleSummaryChange}
              placeholder={t('entry.wizard.summary')}
              value={entryForm.summary}
            />
            <div className='w-full flex justify-end gap-5 pt-7'>
              <PreviousButton />
              <NextButton />
            </div>
          </form>
        )}

        {/* Step 3: AUTHORS & FEEDS */}
        {stepIndex === 2 && (
          <form
            className='w-full h-full py-5 flex flex-col justify-start items-center gap-5'
            onSubmit={handleSubmitStepThree}
          >
            <div className='flex flex-col justify-between w-full h-full gap-5'>
              {/* Authors */}
              <div className='flex flex-2 flex-col justify-start items-center gap-5 overflow-auto'>
                {/* Authors header */}
                <div className='flex w-full justify-center items-center gap-5 text-STUColor'>
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
                <div className='flex w-full gap-5'>
                  <CustomInput
                    onChange={(e) => handleAuthorNameChange(0, e)}
                    onInvalid={handleAuthorNameInvalid}
                    placeholder={t('entry.wizard.authorName')}
                    required
                    value={entryForm.authors[0]?.name}
                  />

                  <CustomInput
                    onChange={(e) => handleAuthorSurnameChange(0, e)}
                    onInvalid={handleAuthorSurnameInvalid}
                    placeholder={t('entry.wizard.authorSurname')}
                    required
                    value={entryForm.authors[0]?.surname}
                  />
                </div>

                {/* Contributors */}
                <div className='flex flex-col gap-2 w-full'>
                  {entryForm.authors.slice(1).map((_, index) => (
                    <div key={index} className='flex w-full items-end gap-5'>
                      <CustomInput
                        required
                        placeholder={t('entry.wizard.coName')}
                        onChange={(e) => handleAuthorNameChange(index + 1, e)}
                        onInvalid={handleContributorNameInvalid}
                        value={entryForm.authors[index + 1].name}
                      />

                      <CustomInput
                        required
                        placeholder={t('entry.wizard.coSurname')}
                        onChange={(e) =>
                          handleAuthorSurnameChange(index + 1, e)
                        }
                        onInvalid={handleContributorSurnameInvalid}
                        value={entryForm.authors[index + 1].surname}
                      />

                      <button
                        className='text-red hover:text-darkGray dark:hover:text-white h-fit mb-2'
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
              <div className='flex flex-col flex-1 justify-start items-center gap-5 bg-lightGray dark:bg-darkGray p-2 overflow-auto rounded-md'>
                {/* Feeds header */}
                <div className='flex w-full justify-center items-center gap-5 text-STUColor'>
                  <span className='text-xl font-bold'>
                    {t('entry.wizard.feeds')}
                  </span>
                  <button
                    className='hover:text-darkGray dark:hover:text-white'
                    onClick={handleOpenFeedWrapper}
                    type='button'
                  >
                    <IoAddCircle size={30} />
                  </button>
                </div>

                {/* Feeds contianer*/}
                <div className='flex w-full flex-wrap'>
                  {entryForm.feeds.map((feed, index) => (
                    <div key={index} className='w-1/3 p-2'>
                      <button
                        type='button'
                        key={index}
                        className='bg-STUColor w-full h-full p-2 rounded-md hover:bg-red flex justify-between items-center text-white gap-5 font-bold'
                        onClick={() => handleRemoveFeed(index)}
                      >
                        {feed.title}
                        <MdRemoveCircle size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='w-full flex justify-end gap-5'>
              <PreviousButton />
              <NextButton />
            </div>
          </form>
        )}

        {/* Step 4: CITATION */}
        {stepIndex === 3 && (
          <form
            className='w-full h-full py-5 flex flex-col justify-start items-center rounded-md gap-5'
            onSubmit={handleSubmitStepFour}
          >
            <CustomTextArea
              onChange={handleCitationChange}
              placeholder={t('entry.wizard.citation')}
              value={entryForm.citation}
            />

            <div className='w-full flex justify-end gap-5 pt-7'>
              <PreviousButton />
              <NextButton />
            </div>
          </form>
        )}

        {/* Step 5: IMAGE & PDF */}
        {stepIndex === 4 && (
          <form
            className='w-full h-full py-5 flex flex-col justify-start items-center rounded-md gap-5'
            onSubmit={handleSubmitStepFive}
          >
            <div className='w-full h-full flex flex-col bg-lightGray dark:bg-darkGray rounded-md p-5 gap-5'>
              {/* IMAGE */}
              <Dropzone
                title={t('entry.wizard.image')}
                maxSizeDescription='(MAX 5 MB)'
                value={entryForm.image}
                maxSize={1024 * 1024 * 5}
                setFile={handleSetImage}
                errorMessage={t('dropzone.errorMessage.image')}
                hint={t('entry.wizard.imageHint')}
              />

              {/* PDF */}
              {!edit && (
                <Dropzone
                  pdf
                  title='pdf'
                  setFile={handleSetPDF}
                  errorMessage={t('dropzone.errorMessage.pdf')}
                  hint={t('entry.wizard.pdfHint')}
                />
              )}
            </div>
            <div className='w-full flex justify-end gap-5'>
              <PreviousButton />
              <NextButton end />
            </div>
          </form>
        )}
      </div>
      {openFeeds && (
        <ModalWrapper
          onClick={handleAddFeeds}
          buttonLabel={t('modal.feedMenu.label')}
          setOpen={setOpenFeeds}
          title={t('modal.feedMenu.title')}
        >
          <FeedMenu
            isLoading={isLoading}
            activeFeeds={activeFeeds}
            setActiveFeeds={setActiveFeeds}
            feeds={feeds}
          />
        </ModalWrapper>
      )}
      {openApplyInfo && (
        <ModalWrapper
          onClick={handleApplyInfo}
          buttonLabel={t('modal.applyInfo.label')}
          setOpen={setOpenApplyInfo}
          title={t('modal.applyInfo.title')}
        >
          <ApplyInfo />
        </ModalWrapper>
      )}
    </div>
  );
};

export default EntryWizard;
