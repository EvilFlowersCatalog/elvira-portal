import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/common/Breadcrumb';
import useCustomEffect from '../../../hooks/useCustomEffect';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, FormEvent, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ElviraInput from '../../../components/common/ElviraInput';
import { IoRemoveCircle } from 'react-icons/io5';
import Button from '../../../components/common/Button';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { IoMdAdd } from 'react-icons/io';
import FeedMenu from '../../../components/feeds/FeedMenu';
import { toast } from 'react-toastify';
import useEditEntry from '../../../hooks/api/entries/useEditEntry';
import ConfigItem from './components/ConfigItem';
import ElviraSelect from '../../../components/common/ElviraSelect';
import LanguageAutofill from '../../../components/common/LanguageAutofill';
import { ContentEditableEvent } from 'react-simple-wysiwyg';
import WYSIWYG from '../../../components/common/WYSIWYG';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { setEditingEntryTitle } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNewForm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >([]);
  const year = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<string>('YYYY');
  const [selectedMonth, setSelectedMonth] = useState<string>('MM');
  const [selectedDay, setSelectedDay] = useState<string>('DD');
  const [maxDay, setMaxDay] = useState<number>(31);

  const getEntryDetail = useGetEntryDetail();
  const navigate = useNavigate();
  const editEntry = useEditEntry();

  useCustomEffect(() => {
    try {
      (async () => {
        setIsLoading(true);
        if (id) {
          const { response: entryDetail } = await getEntryDetail(id);
          setEditingEntryTitle(entryDetail.title);
          setActiveFeeds(entryDetail.feeds);

          setEntry({
            title: entryDetail.title,
            authors: entryDetail.authors,
            feeds: entryDetail.feeds.map((feed) => ({
              title: feed.title,
              id: feed.id,
            })),
            summary: entryDetail.summary,
            language_code:
              entryDetail.language?.alpha3 ?? entryDetail.language?.alpha2,
            identifiers: entryDetail.identifiers,
            config: entryDetail.config,
            citation: entryDetail.citation,
            published_at: '',
            publisher: entryDetail.publisher,
            thumbnail: entryDetail.thumbnail,
          });
          const [y, m, d] = entryDetail.published_at?.split('-');
          if (y) setSelectedYear(y);
          if (m) setSelectedMonth(parseInt(m).toString()); // remove the '0'2 to just 2...
          if (d) setSelectedDay(parseInt(d).toString()); // same
        }
      })();
    } catch {
      setEntry(null);
      navigate(NAVIGATION_PATHS.adminHome, { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // feed add/remove handlers
  useCustomEffect(() => {
    setEntry((prevEntry) => ({
      ...prevEntry!,
      feeds: activeFeeds.map((feed) => ({
        title: feed.title,
        id: feed.id,
      })),
    }));
  }, [activeFeeds]);

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
    const authors = entry!.authors;
    authors.push({ name: '', surname: '' });

    setEntry((prevEntry) => ({
      ...prevEntry!,
      authors: authors,
    }));
  };
  const removeAuthor = (i: number) => {
    const authors = entry!.authors.filter((_, index) => index !== i);
    setEntry((prevEntry) => ({
      ...prevEntry!,
      authors: authors,
    }));
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.setCustomValidity(''); // reset invalidity
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      title: event.target.value, // Update the title property
    }));
  };
  const handleDOIChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      identifiers: { ...prevEntry?.identifiers!, doi: event.target.value }, // Update the doi property
    }));
  };
  const handleISBNChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      identifiers: { ...prevEntry?.identifiers!, isbn: event.target.value }, // Update the isbn property
    }));
  };
  const handleSummaryChange = (event: ContentEditableEvent) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      summary: event.target.value, // Update the summary property
    }));
  };
  const handleCitationChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      citation: event.target.value, // Update the citation property
    }));
  };
  const handlePublisherChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      publisher: event.target.value, // Update the publisher property
    }));
  };
  // const handleCopiesChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setEntry((prevEntry) => ({
  //     ...prevEntry!, // Preserve existing properties of entryForm
  //     : event.target.value, // Update the copies property
  //   }));
  // };
  const handleAuthorNameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.target.setCustomValidity('');
    const updatedAuthors = entry!.authors;
    updatedAuthors[index].name = event.target.value;

    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    }));
  };
  const handleAuthorSurnameChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    event.target.setCustomValidity('');
    const updatedAuthors = entry!.authors;
    updatedAuthors[index].surname = event.target.value;

    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      authors: updatedAuthors,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newEntry: IEntryNew = {
      title: entry!.title,
      authors: entry!.authors,
      feeds: entry!.feeds.map((feed) => {
        return feed.id;
      }),
      summary: entry!.summary,
      language_code: entry!.language_code,
      config: entry!.config,
      identifiers: {
        doi: entry!.identifiers?.doi ?? '',
        isbn: entry!.identifiers?.isbn ?? '',
      },
      citation: entry!.citation ?? '',
      publisher: entry!.publisher,
    };
    if (entry!.published_at) newEntry.published_at = entry!.published_at;

    // Upload
    try {
      setIsLoading(true);
      await editEntry(id!, newEntry);
      toast.success(t('notifications.entry.edit.success'));
      navigate(NAVIGATION_PATHS.adminEntries, { replace: true });
    } catch {
      toast.error(t('notifications.entry.edit.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col flex-1'>
      <Breadcrumb />
      {!entry || isLoading ? (
        <PageLoading />
      ) : (
        <form
          className='flex flex-col flex-1 p-4 pt-0 gap-4'
          onSubmit={handleSubmit}
        >
          <div className='flex flex-1 flex-col xl:flex-row gap-4'>
            {/* First column */}
            <div className='flex flex-col flex-2 gap-4'>
              {/* First row, first column */}
              <div className='bg-zinc-100 dark:bg-darkGray rounded-md p-4 flex flex-col gap-2'>
                <span>{t('entry.wizard.titleNamespace')}</span>
                <ElviraInput
                  onChange={handleTitleChange}
                  placeholder={'entry.wizard.title'}
                  invalidMessage={t('entry.wizard.requiredMessages.title')}
                  value={entry.title ?? ''}
                  required
                />
              </div>

              {/* Second row, first column */}
              <div className='flex flex-col md:flex-row bg-zinc-100 dark:bg-darkGray gap-4 rounded-md p-4'>
                {/* Image */}
                <img
                  className='bg-gray border border-white w-48 h-min rounded-md'
                  alt='thumbnail'
                  src={entry.thumbnail + `?access_token=${auth?.token}`}
                ></img>

                {/* Information */}
                <div className='flex flex-col flex-2'>
                  <div className='flex flex-col gap-4'>
                    <span>{t('entry.wizard.additionalData')}</span>
                    <ElviraInput
                      onChange={handlePublisherChange}
                      placeholder={t('entry.wizard.publisher')}
                      value={entry.publisher ?? ''}
                    />
                    <LanguageAutofill
                      entryForm={entry}
                      setEntryForm={setEntry}
                    />
                    <ElviraInput
                      onChange={() => {}}
                      placeholder={t('entry.wizard.copies')}
                      value={''}
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
                  </div>
                </div>
              </div>
              {/* Third row, first column */}
              <div className='flex flex-col xxl:flex-row bg-zinc-100 dark:bg-darkGray p-4 rounded-md gap-4'>
                {/* Identifiers */}
                <div className='flex flex-1 flex-col gap-2'>
                  <span>{t('entry.wizard.identifiers')}</span>
                  <div className='flex flex-col gap-4'>
                    <ElviraInput
                      onChange={handleDOIChange}
                      placeholder={'DOI'}
                      value={entry.identifiers?.doi ?? ''}
                    />
                    <ElviraInput
                      onChange={handleISBNChange}
                      placeholder={'ISBN'}
                      value={entry.identifiers?.isbn ?? ''}
                    />
                  </div>
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
                          ...prevEntry!,
                          config: {
                            ...prevEntry?.config!,
                            evilflowres_metadata_fetch: e.target.checked,
                          },
                        }));
                      }}
                    />
                    <ConfigItem
                      name={t('entry.wizard.share')}
                      checked={entry.config?.evilflowers_share_enabled ?? false}
                      onChange={(e) => {
                        setEntry((prevEntry) => ({
                          ...prevEntry!,
                          config: {
                            ...prevEntry?.config!,
                            evilflowers_share_enabled: e.target.checked,
                          },
                        }));
                      }}
                    />
                    <ConfigItem
                      name={t('entry.wizard.print')}
                      checked={entry.config?.evilflowers_viewer_print ?? false}
                      onChange={(e) => {
                        setEntry((prevEntry) => ({
                          ...prevEntry!,
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
                          ...prevEntry!,
                          config: {
                            ...prevEntry?.config!,
                            evilflowers_annotations_create: e.target.checked,
                          },
                        }));
                      }}
                    />
                    <ConfigItem
                      name={'OCR'}
                      checked={entry.config?.evilflowers_ocr_enabled ?? false}
                      onChange={(e) => {
                        setEntry((prevEntry) => ({
                          ...prevEntry!,
                          config: {
                            ...prevEntry?.config!,
                            evilflowers_ocr_enabled: e.target.checked,
                          },
                        }));
                      }}
                    />
                    <ConfigItem
                      name={'DRM'}
                      checked={entry.config?.evilflowers_ocr_rewrite ?? false}
                      onChange={(e) => {
                        setEntry((prevEntry) => ({
                          ...prevEntry!,
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
              {/* Forth row, first column */}
              <div className='flex flex-col md:flex-row gap-4'>
                {/* Authors */}
                <div className='min-h-96 flex flex-col flex-1 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                  <div
                    className='w-full flex justify-center items-center gap-2 cursor-pointer'
                    onClick={addAuthor}
                  >
                    <span>{t('entry.wizard.authors')}</span>
                    <IoMdAdd size={20} />
                  </div>
                  <div className='flex-1 bg-white dark:bg-gray rounded-md'>
                    <div className='flex flex-col flex-1 p-4 gap-4'>
                      {entry.authors?.map((author, index) => (
                        <div
                          className='flex w-full gap-4 items-center'
                          key={index}
                        >
                          <input
                            type='text'
                            onChange={(e) => handleAuthorNameChange(index, e)}
                            className='w-1/2 bg-transparent border-b-2 border-black dark:border-white outline-none'
                            value={author.name}
                          />
                          <input
                            onChange={(e) =>
                              handleAuthorSurnameChange(index, e)
                            }
                            type='text'
                            className='w-1/2 bg-transparent border-b-2 border-black dark:border-white outline-none'
                            value={author.surname}
                          />
                          <IoRemoveCircle
                            color='red'
                            size={20}
                            className='cursor-pointer'
                            onClick={() => removeAuthor(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Feeds */}
                <div className='min-h-96 flex flex-col flex-1 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                  <div className='w-full flex justify-center items-center gap-2'>
                    <span>{t('entry.wizard.feeds')}</span>
                  </div>
                  <div className='flex flex-col flex-1 w-full min-h-72 rounded-md'>
                    <FeedMenu
                      activeFeeds={activeFeeds}
                      setActiveFeeds={setActiveFeeds}
                    />
                  </div>
                </div>
                {/* Categories */}
                <div className='min-h-96 flex flex-col flex-1 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                  <div
                    className='w-full flex justify-center items-center gap-2 cursor-pointer'
                    onClick={addAuthor}
                  >
                    <span>{t('entry.wizard.categories')}</span>
                    <IoMdAdd size={20} />
                  </div>
                  <div className='flex-1 rounded-md'></div>
                </div>
              </div>
            </div>
            {/* Second column */}
            <div className='flex flex-col flex-1 gap-4'>
              <div className='flex-1 min-h-60 bg-zinc-100 dark:bg-darkGray rounded-md p-4'>
                <span>{t('entry.wizard.files')}</span>
              </div>
              <div className='flex flex-col flex-3 min-h-60 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                <span>{t('entry.wizard.summary')}</span>
                <WYSIWYG value={entry.summary} onChange={handleSummaryChange} />
              </div>
              <div className='flex flex-col min-h-96 md:min-h-0 flex-3 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                <span>{t('entry.wizard.citation')}</span>
                <textarea
                  onChange={handleCitationChange}
                  className='bg-white dark:bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                  placeholder={t('entry.wizard.citation')}
                  value={entry.citation ?? ''}
                />
              </div>
            </div>
          </div>
          <div className='flex justify-center'>
            <Button type='submit'>
              <span>{t('entry.wizard.edit')}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminEditEntry;
