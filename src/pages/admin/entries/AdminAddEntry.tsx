import { ChangeEvent, FormEvent, InvalidEvent, useState } from 'react';
import {
  IEntryDetail,
  IEntryInfo,
  IEntryNew,
  IEntryNewForm,
} from '../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IoAddCircle } from 'react-icons/io5';
import { MdRemoveCircle } from 'react-icons/md';
import CustomInput from '../../../components/common/CustomInput';
import CustomTextArea from '../../../components/common/CustomTextArea';
import { toast } from 'react-toastify';
import FeedMenu from '../../../components/feed/FeedMenu';
import Dropzone from '../../../components/common/Dropzone';
import { getBase64 } from '../../../utils/func/functions';
import useUploadEntry from '../../../hooks/api/entries/useUploadEntry';
import {
  IDENTIFIERS_TYPE,
  NAVIGATION_PATHS,
} from '../../../utils/interfaces/general/general';
import useGetData from '../../../hooks/api/identifiers/useGetData';
import PageLoading from '../../../components/page/PageLoading';
import Breadcrumb from '../../../components/common/Breadcrumb';
import ApplyInfoDialog from '../../../components/dialogs/ApplyInfoDialog';
import useCustomEffect from '../../../hooks/useCustomEffect';

interface IEntryWizardParams {
  form?: IEntryDetail;
}
const AdminAddEntry = ({ form }: IEntryWizardParams) => {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [openApplyInfo, setOpenApplyInfo] = useState<boolean>(false);
  const [entryInfo, setEntryInfo] = useState<IEntryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [identifier, setIdentifier] = useState<string>('');
  const [identifierType, setIdentifierType] = useState<IDENTIFIERS_TYPE | null>(
    null
  );
  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >(
    (form?.response.feeds ?? []).map((feed) => ({
      title: feed.title,
      id: feed.id,
    }))
  );
  const uploadEntry = useUploadEntry();
  const navigate = useNavigate();
  const getData = useGetData();

  const NextButton = ({ end = false }) => {
    return (
      <button
        className='py-2 px-5 font-bold hover:text-black dark:hover:text-white bg-STUColor hover:bg-opacity-50 text-white rounded-md duration-200'
        type='submit'
      >
        {end ? t('entry.wizard.upload') : t('entry.wizard.next')}
      </button>
    );
  };
  const PreviousButton = () => {
    return (
      <button
        className='hover:underline'
        onClick={() => setStepIndex((prevIndex) => prevIndex - 1)}
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

  // feed add/remove handlers
  useCustomEffect(() => {
    setEntryForm({
      ...entryForm,
      feeds: activeFeeds.map((feed) => ({ title: feed.title, id: feed.id })),
    });
  }, [activeFeeds]);

  // Handlers for submiting in steps
  const handleSubmitStepOne = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // if there is some identifier
      if (identifier) {
        // set loading
        setIsLoading(true);
        let identifierTypeHolder: IDENTIFIERS_TYPE | null = null;
        if (identifier.startsWith('10')) {
          identifierTypeHolder = IDENTIFIERS_TYPE.doi;
          setEntryForm((prevForm) => ({
            ...prevForm, // Preserve existing properties of entryForm
            identifiers: {
              ...prevForm.identifiers, // Preserve existing properties of identifiers
              doi: identifier, // Update the isbn property
            },
          }));
        } else {
          identifierTypeHolder = IDENTIFIERS_TYPE.isbn;
          setEntryForm((prevForm) => ({
            ...prevForm, // Preserve existing properties of entryForm
            identifiers: {
              ...prevForm.identifiers, // Preserve existing properties of identifiers
              isbn: identifier, // Update the isbn property
            },
          }));
        }

        // get info from endpoint
        const givenEntryInfo = await getData(identifierTypeHolder, identifier);

        setIdentifierType(identifierTypeHolder);
        // If succes save
        setEntryInfo(givenEntryInfo);

        // Notify and open apply info dialog
        toast.success(t('notifications.dataFromIdentifiers.success'));
        setOpenApplyInfo(true);
      }
    } catch {
      setOpenApplyInfo(false);
      // Notify about error
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      // Whatever happens go to next step and set loading to false
      setIsLoading(false);
      setStepIndex((prevIndex) => prevIndex + 1);
    }
  };
  const handleSubmitStepTwo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex((prevIndex) => prevIndex + 1);
  };
  const handleSubmitStepThree = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex((prevIndex) => prevIndex + 1);
  };
  const handleSubmitStepFour = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStepIndex((prevIndex) => prevIndex + 1);
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
    } else if (!pdf) {
      // If there is no pdf notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.pdf'));
    } else {
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
  const handleIndentifierChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIdentifier(event.target.value);
  };
  const handleApplyInfo = () => {
    setEntryForm((prevForm) => ({
      ...prevForm,
      title: entryInfo?.response.title ?? '',
      authors: entryInfo?.response.authors ?? [],
      publisher: entryInfo?.response.publisher ?? '',
      year: entryInfo?.response.year ?? '',
      language_code: entryInfo?.response.language ?? '',
      citation: entryInfo?.response.bibtex ?? '',
    }));

    setOpenApplyInfo(false);
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
    event.target.setCustomValidity('');
    const updatedAuthors = entryForm.authors;
    updatedAuthors[index].name = event.target.value;

    setEntryForm((prevForm) => ({
      ...prevForm, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    }));
  };
  const handleAuthorNameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.authorName'));
  };
  const handleContributorNameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(t('entry.wizard.requiredMessages.coName'));
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
  const handleAuthorSurnameInvalid = (e: InvalidEvent<HTMLInputElement>) => {
    e.target.setCustomValidity(
      t('entry.wizard.requiredMessages.authorSurname')
    );
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
    <>
      <Breadcrumb />
      <div className='flex flex-col flex-1 items-center overflow-auto p-4'>
        <div className='flex-1 flex w-full justify-center items-center'>
          <div className='w-full h-full md:w-2/3 lg:w-4/6 xl:w-3/5 xxl:w-2/5 flex flex-col justify-center items-center gap-4'>
            {/* Step 1: DOI & ISBN */}
            {stepIndex === 0 && (
              <form
                className='w-full h-fit bg-zinc-100 dark:bg-darkGray p-4 flex flex-col justify-start items-center rounded-md gap-4'
                onSubmit={handleSubmitStepOne}
              >
                {isLoading ? (
                  <div className='w-full h-96 flex'>
                    <PageLoading />
                  </div>
                ) : (
                  <>
                    <span className='text-3xl font-extrabold '>
                      {t('entry.wizard.identifiers')}
                    </span>
                    <CustomInput
                      onChange={handleIndentifierChange}
                      placeholder='DOI / ISBN'
                      value={identifier}
                    />
                    <div className='w-full flex justify-end'>
                      <NextButton />
                    </div>
                  </>
                )}
              </form>
            )}
            {/* Step 2: ADDITIONAL DATA */}
            {stepIndex === 1 && (
              <form
                className='w-full h-fit bg-zinc-100 dark:bg-darkGray p-4 flex flex-col justify-start items-center rounded-md gap-4'
                onSubmit={handleSubmitStepTwo}
              >
                <span className='text-3xl font-extrabold '>
                  {t('entry.wizard.additionalData')}
                </span>
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
                <div className='w-full flex justify-end gap-4 pt-7'>
                  <PreviousButton />
                  <NextButton />
                </div>
              </form>
            )}

            {/* Step 3: AUTHORS & FEEDS */}
            {stepIndex === 2 && (
              <form
                className='w-full h-full bg-zinc-100 dark:bg-darkGray p-4 flex flex-col justify-start items-center gap-4'
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
                        <div
                          key={index}
                          className='flex w-full items-end gap-4'
                        >
                          <CustomInput
                            required
                            placeholder={t('entry.wizard.coName')}
                            onChange={(e) =>
                              handleAuthorNameChange(index + 1, e)
                            }
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
                  <div className='flex flex-col flex-1 justify-start items-center gap-4 bg-lightGray dark:bg-darkGray p-2 rounded-md'>
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
                <div className='w-full flex justify-end gap-4'>
                  <PreviousButton />
                  <NextButton />
                </div>
              </form>
            )}

            {/* Step 4: CITATION */}
            {stepIndex === 3 && (
              <form
                className='w-full h-full bg-zinc-100 dark:bg-darkGray p-4 flex flex-col justify-start items-center rounded-md gap-4'
                onSubmit={handleSubmitStepFour}
              >
                <span className='text-3xl font-extrabold '>
                  {t('entry.wizard.citation')}
                </span>
                <CustomTextArea
                  onChange={handleCitationChange}
                  placeholder={t('entry.wizard.citation')}
                  value={entryForm.citation}
                />

                <div className='w-full flex justify-end gap-4 pt-7'>
                  <PreviousButton />
                  <NextButton />
                </div>
              </form>
            )}

            {/* Step 5: IMAGE & PDF */}
            {stepIndex === 4 && (
              <form
                className='w-full h-full bg-zinc-100 dark:bg-darkGray p-4 flex flex-col justify-start items-center rounded-md gap-4'
                onSubmit={handleSubmitStepFive}
              >
                <span className='text-3xl font-extrabold '>
                  {t('entry.wizard.imageAndFile')}
                </span>
                <div className='w-full h-full flex flex-col bg-lightGray dark:bg-darkGray rounded-md p-4 gap-4'>
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
                  <Dropzone
                    pdf
                    title='pdf'
                    setFile={handleSetPDF}
                    errorMessage={t('dropzone.errorMessage.pdf')}
                    hint={t('entry.wizard.pdfHint')}
                  />
                </div>
                <div className='w-full flex justify-end gap-4'>
                  <PreviousButton />
                  <NextButton end />
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {openApplyInfo && identifierType && (
        <ApplyInfoDialog
          type={identifierType}
          identifier={identifier}
          close={setOpenApplyInfo}
          yes={handleApplyInfo}
        />
      )}
    </>
  );
};

export default AdminAddEntry;
