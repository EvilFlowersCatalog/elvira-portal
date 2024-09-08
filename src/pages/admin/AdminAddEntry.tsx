import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/buttons/Breadcrumb';
import useCustomEffect from '../../hooks/useCustomEffect';
import { ChangeEvent, FormEvent, useState } from 'react';
import {
  IEntryInfo,
  IEntryNew,
  IEntryNewForm,
} from '../../utils/interfaces/entry';
import PageLoading from '../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import ElviraInput from '../../components/inputs/ElviraInput';
import { IoRemoveCircle } from 'react-icons/io5';
import Button from '../../components/buttons/Button';
import {
  IDENTIFIERS_TYPE,
  NAVIGATION_PATHS,
} from '../../utils/interfaces/general/general';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import { IoMdAdd, IoMdDownload } from 'react-icons/io';
import { toast } from 'react-toastify';
import ElviraSelect from '../../components/inputs/ElviraSelect';
import { ContentEditableEvent } from 'react-simple-wysiwyg';
import WYSIWYG from '../../components/inputs/WYSIWYG';
import { MdRemoveCircle } from 'react-icons/md';
import { IEntryAuthor } from '../../utils/interfaces/author';
import useGetAuthors from '../../hooks/api/authors/useGetAuthors';
import useGetData from '../../hooks/api/identifiers/useGetData';
import ApplyInfoDialog from '../../components/dialogs/ApplyInfoDialog';
import { CircleLoader } from 'react-spinners';
import ImageDropzone from '../../components/dropzones/ImageDropzone';
import { getBase64 } from '../../utils/func/functions';
import LanguageAutofill from '../../components/autofills/LanguageAutofill';
import ConfigItem from '../../components/specific-page/admin-entry-page/ConfigItem';
import AuthorsAutofill from '../../components/autofills/AuthorsAutofill';
import FeedAutofill from '../../components/autofills/FeedAutofill';
import CategoryAutofill from '../../components/autofills/CategoryAutofill';
import FileDropzone from '../../components/dropzones/FileDropzone';
import ElviraTextarea from '../../components/inputs/ElviraTextarea';
import useUploadEntry from '../../hooks/api/entries/useUploadEntry';
import useCreateEntryAcquistion from '../../hooks/api/acquisitiions/useCreateEntryAcquistion';

const AdminAddEntry = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { STUColor } = useAppContext();
  const [entry, setEntry] = useState<IEntryNewForm>({
    title: '',
    authors: [{ name: '', surname: '' }],
    feeds: [],
    summary: '',
    identifiers: {
      doi: '',
      isbn: '',
    },
    config: {
      evilflowers_viewer_print: false,
      evilflowers_share_enabled: false,
      evilflowres_metadata_fetch: false,
      evilflowers_annotations_create: false,
      evilflowers_ocr_rewrite: false,
    },
    categories: [],
    citation: '',
    published_at: '',
    publisher: '',
  });
  const [authors, setAuthors] = useState<IEntryAuthor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openApplyInfo, setOpenApplyInfo] = useState<boolean>(false);
  const year = new Date().getFullYear();
  const [identifier, setIdentifier] = useState<string>('');
  const [identifierType, setIdentifierType] = useState<IDENTIFIERS_TYPE | null>(
    null
  );
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);
  const [entryInfo, setEntryInfo] = useState<IEntryInfo | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('YYYY');
  const [selectedMonth, setSelectedMonth] = useState<string>('MM');
  const [selectedDay, setSelectedDay] = useState<string>('DD');
  const [maxDay, setMaxDay] = useState<number>(31);
  const [stringImage, setStringImage] = useState<string>('');
  const [isFilesLoading, setIsFilesLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<
    { id: string; relation: string; file: File }[]
  >([]);

  const navigate = useNavigate();
  const uploadEntry = useUploadEntry();
  const getData = useGetData();
  const getAuthors = useGetAuthors();
  const createEntryAcquisition = useCreateEntryAcquistion();

  useCustomEffect(() => {
    try {
      (async () => {
        const { items: a } = await getAuthors({ paginate: false });
        setAuthors(a);
      })();
    } catch {}
  }, []);

  const handleIdentifier = async (
    driver: IDENTIFIERS_TYPE,
    identifier: string
  ) => {
    try {
      setLoadingInfo(true);
      const info = await getData(driver, identifier);

      setOpenApplyInfo(true);
      setIdentifierType(driver);
      setIdentifier(identifier);
      setEntryInfo(info);

      toast.success(t('notifications.dataFromIdentifiers.success'));
    } catch {
      toast.error(t('notifications.dataFromIdentifiers.error'));
    } finally {
      setLoadingInfo(false);
    }
  };

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
      setEntry((prev) => ({
        ...prev!,
        published_at: `${selectedYear}-${selectedMonth}-${selectedDay}`,
      }));
    } else if (selectedYear !== 'YYYY' && selectedMonth !== 'MM') {
      setEntry((prev) => ({
        ...prev!,
        published_at: `${selectedYear}-${selectedMonth}`,
      }));
    } else if (selectedYear !== 'YYYY') {
      setEntry((prev) => ({
        ...prev!,
        published_at: `${selectedYear}`,
      }));
    } else {
      setEntry((prev) => ({
        ...prev!,
        published_at: '',
      }));
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const addAuthor = () => {
    const authors = entry.authors;
    authors.push({ name: '', surname: '' });

    setEntry((prevEntry) => ({
      ...prevEntry,
      authors: authors,
    }));
  };
  const removeAuthor = (i: number) => {
    const authors = entry.authors.filter((_, index) => index !== i);
    setEntry((prevEntry) => ({
      ...prevEntry,
      authors: authors,
    }));
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity(''); // reset invalidity
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      title: event.target.value, // Update the title property
    }));
  };
  const handleDOIChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      identifiers: { ...prevEntry?.identifiers!, doi: event.target.value }, // Update the doi property
    }));
  };
  const handleISBNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      identifiers: { ...prevEntry?.identifiers!, isbn: event.target.value }, // Update the isbn property
    }));
  };
  const handleSummaryChange = (event: ContentEditableEvent) => {
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      summary: event.target.value, // Update the summary property
    }));
  };
  const handleCitationChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      citation: event.target.value, // Update the citation property
    }));
  };
  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newEntry: IEntryNew = {
      title: entry.title,
      authors: entry.authors,
      feeds: entry.feeds.map((feed) => {
        return feed.id;
      }),
      summary: entry.summary,
      language_code: entry.language_code,
      config: entry.config,
      categories: entry.categories,
      identifiers: {
        doi: entry.identifiers?.doi ?? '',
        isbn: entry.identifiers?.isbn ?? '',
      },
      citation: entry.citation ?? '',
      publisher: entry.publisher,
      image: stringImage,
    };
    if (entry.published_at) newEntry.published_at = entry.published_at;

    if (!newEntry.image) {
      // If there is no image notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.image'));
    } else if (files.length === 0) {
      toast.warning(t('entry.wizard.requiredMessages.pdf'));
    } else {
      // Upload
      try {
        setIsLoading(true);
        const { response: info } = await uploadEntry(newEntry);

        await Promise.all(
          files.map(async (item) => {
            const metadata = {
              relation: item.relation,
            };
            try {
              // Perform all file uploads concurrently
              const entryAcquisition = new FormData();
              // Append needed variables
              entryAcquisition.append('content', item.file);
              entryAcquisition.append('metadata', JSON.stringify(metadata));

              await createEntryAcquisition(entryAcquisition, info.id);
            } catch {
              // Show error notification
              toast.error(
                t('notifications.acquisition.add.error', item.file.name)
              );
            }
          })
        );
        toast.success(t('notifications.entry.add.success'));
        navigate(NAVIGATION_PATHS.adminEntries, { replace: true });
      } catch {
        toast.error(t('notifications.entry.add.error'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className='flex flex-col w-full'>
        <Breadcrumb />
        {entry === null || isLoading ? (
          <PageLoading />
        ) : (
          <form
            className='flex flex-col flex-1 p-4 pt-0 gap-4'
            onSubmit={handleSubmit}
          >
            <div className='flex flex-1 flex-col xl:flex-row gap-4'>
              {/* First column */}
              <div className='flex flex-col flex-1 gap-4'>
                {/* First row, first column */}
                <div className='flex flex-col bg-zinc-100 dark:bg-darkGray p-4 rounded-md gap-4'>
                  {/* Identifiers */}
                  <div className='flex flex-1 flex-col gap-2'>
                    <span>{t('entry.wizard.identifiers')}</span>
                    {loadingInfo ? (
                      <div
                        className={'flex h-full justify-center items-center'}
                      >
                        <CircleLoader color={STUColor} size={30} />
                      </div>
                    ) : (
                      <div className='flex flex-col gap-4'>
                        <div className='w-full flex gap-2 relative items-center'>
                          <ElviraInput
                            onChange={handleDOIChange}
                            placeholder={'DOI'}
                            value={entry.identifiers?.doi ?? ''}
                          />
                          <IoMdDownload
                            className='absolute right-2 top-8 z-50 cursor-pointer'
                            size={20}
                            onClick={() =>
                              handleIdentifier(
                                IDENTIFIERS_TYPE.doi,
                                entry.identifiers?.doi
                              )
                            }
                            color={STUColor}
                          />
                        </div>
                        <div className='w-full flex gap-2 relative items-center'>
                          <ElviraInput
                            onChange={handleISBNChange}
                            placeholder={'ISBN'}
                            value={entry.identifiers?.isbn ?? ''}
                          />
                          <IoMdDownload
                            className='absolute right-2 top-8 z-50 cursor-pointer'
                            size={20}
                            onClick={() =>
                              handleIdentifier(
                                IDENTIFIERS_TYPE.isbn,
                                entry.identifiers?.isbn
                              )
                            }
                            color={STUColor}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col flex-2 gap-2'>
                    <span>{t('entry.wizard.configuration')}</span>
                    <div className='bg-white dark:bg-gray flex-1 rounded-md grid grid-cols-2 xxl:grid-cols-3 gap-4'>
                      <ConfigItem
                        name={t('entry.wizard.download')}
                        checked={
                          entry.config?.evilflowres_metadata_fetch ?? false
                        }
                        onChange={(e) => {
                          setEntry((prevEntry) => ({
                            ...prevEntry,
                            config: {
                              ...prevEntry.config!,
                              evilflowres_metadata_fetch: e.target.checked,
                            },
                          }));
                        }}
                      />
                      <ConfigItem
                        name={t('entry.wizard.share')}
                        checked={
                          entry.config?.evilflowers_share_enabled ?? false
                        }
                        onChange={(e) => {
                          setEntry((prevEntry) => ({
                            ...prevEntry,
                            config: {
                              ...prevEntry?.config!,
                              evilflowers_share_enabled: e.target.checked,
                            },
                          }));
                        }}
                      />
                      <ConfigItem
                        name={t('entry.wizard.print')}
                        checked={
                          entry.config?.evilflowers_viewer_print ?? false
                        }
                        onChange={(e) => {
                          setEntry((prevEntry) => ({
                            ...prevEntry,
                            config: {
                              ...prevEntry?.config!,
                              evilflowers_viewer_print: e.target.checked,
                            },
                          }));
                        }}
                      />
                      <ConfigItem
                        name={t('entry.wizard.annotations')}
                        checked={
                          entry.config?.evilflowers_annotations_create ?? false
                        }
                        onChange={(e) => {
                          setEntry((prevEntry) => ({
                            ...prevEntry,
                            config: {
                              ...prevEntry?.config!,
                              evilflowers_annotations_create: e.target.checked,
                            },
                          }));
                        }}
                      />
                      <ConfigItem
                        name={'DRM'}
                        checked={entry.config?.evilflowers_ocr_rewrite ?? false}
                        onChange={(e) => {
                          setEntry((prevEntry) => ({
                            ...prevEntry,
                            config: {
                              ...prevEntry?.config!,
                              evilflowers_ocr_rewrite: e.target.checked,
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Second row, first column */}
                <div className='flex flex-col md:flex-row bg-zinc-100 dark:bg-darkGray gap-4 rounded-md p-4'>
                  <div
                    className={`relative w-48 ${
                      stringImage ? 'h-fit' : 'h-full'
                    } p-2 my-auto`}
                  >
                    {stringImage && (
                      <img
                        className='w-full h-auto'
                        src={stringImage}
                        alt='image'
                      />
                    )}
                    {/* Image */}
                    <div className='absolute top-0 left-0 w-full h-full bg-white dark:bg-black bg-opacity-30 dark:bg-opacity-30'>
                      <ImageDropzone
                        title={t('entry.wizard.image')}
                        maxSizeDescription='(MAX 5 MB)'
                        maxSize={1024 * 1024 * 5}
                        setFile={async (file) => {
                          if (file) {
                            const sf = await getBase64(file);
                            setStringImage(sf as string);
                          } else setStringImage('');
                        }}
                        errorMessage={t('dropzone.errorMessage.image')}
                        hint={t('entry.wizard.imageHint')}
                      />
                    </div>
                  </div>

                  {/* Information */}
                  <div className='flex flex-col flex-2'>
                    <div className='flex flex-col gap-4'>
                      <ElviraInput
                        onChange={handleTitleChange}
                        placeholder={t('entry.wizard.title')}
                        invalidMessage={t(
                          'entry.wizard.requiredMessages.title'
                        )}
                        value={entry.title ?? ''}
                        required
                      />
                      <LanguageAutofill
                        entryForm={entry}
                        setEntryForm={setEntry}
                      />
                      <ElviraInput
                        onChange={handlePublisherChange}
                        placeholder={t('entry.wizard.publisher')}
                        value={entry.publisher ?? ''}
                      />
                      <div className='flex flex-col gap-4'>
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
                          {selectedMonth !== 'MM' &&
                            selectedYear !== 'YYYY' && (
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
                    </div>
                  </div>
                </div>

                {/* Third row, first column */}
                <div className='flex flex-col gap-4'>
                  {/* Authors */}
                  <div className='h-64 overflow-auto flex flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                    <div
                      className='w-fit mx-auto flex justify-center items-center gap-2 cursor-pointer'
                      onClick={addAuthor}
                    >
                      <span>{t('entry.wizard.authors')}</span>
                      <IoMdAdd size={20} />
                    </div>
                    <div className='flex-1 rounded-md'>
                      <div className='flex flex-col flex-1 gap-4'>
                        {entry.authors?.map((_, index) => (
                          <div
                            className='flex w-full gap-4 items-start'
                            key={index}
                          >
                            <AuthorsAutofill
                              entryForm={entry}
                              setEntryForm={setEntry}
                              index={index}
                              authors={authors}
                              type='name'
                            />
                            <AuthorsAutofill
                              entryForm={entry}
                              setEntryForm={setEntry}
                              index={index}
                              authors={authors}
                              type='surname'
                            />
                            {index !== 0 && (
                              <IoRemoveCircle
                                color='red'
                                size={50}
                                className='cursor-pointer pt-8'
                                onClick={() => removeAuthor(index)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col md:flex-row gap-4'>
                    {/* Feeds */}
                    <div className='h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2 overflow-auto'>
                      <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
                        <FeedAutofill
                          entryForm={entry}
                          setEntryForm={setEntry}
                        />
                        {entry?.feeds?.map((item, index) => (
                          <div key={index} className={`h-fit`}>
                            <button
                              type='button'
                              className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
                              onClick={() => {
                                setEntry((prev) => ({
                                  ...prev!,
                                  feeds: prev!.feeds.filter(
                                    (prevFeed) => prevFeed.id !== item.id
                                  ),
                                }));
                              }}
                            >
                              {item.title}
                              <MdRemoveCircle size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Categories */}
                    <div className='h-64 flex flex-1 flex-col bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2 overflow-auto'>
                      <div className='flex flex-1 flex-col gap-2 w-full rounded-md'>
                        <CategoryAutofill
                          entryForm={entry}
                          setEntryForm={setEntry}
                        />
                        {entry?.categories?.map((item, index) => (
                          <div key={index} className={`h-fit`}>
                            <button
                              type='button'
                              className='bg-STUColor p-2 text-sm hover:bg-red w-full flex gap-2 justify-between items-center text-white rounded-md'
                              onClick={() => {
                                setEntry((prev) => ({
                                  ...prev!,
                                  categories: prev!.categories.filter(
                                    (pc) => pc.id !== item.id
                                  ),
                                }));
                              }}
                            >
                              {item.term}
                              <MdRemoveCircle size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Second column */}
              <div className='flex flex-col flex-2 gap-4'>
                {/* FILES */}
                <FileDropzone
                  isLoading={isFilesLoading}
                  setIsLoading={setIsFilesLoading}
                  files={files}
                  setFiles={setFiles}
                />
                {/* SUMMARY */}
                <div className='flex flex-col flex-1 min-h-60 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                  <span>{t('entry.wizard.summary')}</span>
                  <WYSIWYG
                    value={entry.summary}
                    onChange={handleSummaryChange}
                  />
                </div>
                {/* CITATION */}
                <div className='flex flex-col min-h-96 xl:min-h-0 flex-2 bg-zinc-100 dark:bg-darkGray rounded-md p-4 pt-2 gap-2'>
                  <ElviraTextarea
                    onChange={handleCitationChange}
                    className='bg-white dark:bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                    placeholder={t('entry.wizard.citation')}
                    value={entry.citation ?? ''}
                  />
                </div>
              </div>
            </div>
            {!isFilesLoading && (
              <div className='flex justify-center'>
                <Button type='submit' title={t('entry.wizard.upload')} />
              </div>
            )}
          </form>
        )}
      </div>
      {openApplyInfo && (
        <ApplyInfoDialog
          type={identifierType!}
          identifier={identifier}
          close={() => {
            setOpenApplyInfo(false);
            setEntryInfo(null);
          }}
          yes={() => {
            if (entryInfo?.response.year) {
              const [y, m, d] = entryInfo?.response.year.split('-') ?? [];
              if (y) setSelectedYear(y);
              if (m) setSelectedMonth(parseInt(m).toString()); // remove the '0'2 to just 2...
              if (d) setSelectedDay(parseInt(d).toString()); // same
            }
            setEntry({
              ...entry,
              title: entryInfo?.response.title ?? entry?.title ?? '',
              authors: entryInfo?.response.authors ?? entry?.authors ?? [],
              publisher:
                entryInfo?.response.publisher ?? entry?.publisher ?? '',
              published_at:
                entryInfo?.response.year ?? entry?.published_at ?? '',
              language_code:
                entryInfo?.response.language ?? entry?.language_code,
              citation: entryInfo?.response.bibtex ?? entry?.citation,
            });
            setOpenApplyInfo(false);
          }}
        />
      )}
    </>
  );
};

export default AdminAddEntry;
