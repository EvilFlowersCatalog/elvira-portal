import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/common/Breadcrumb';
import useCustomEffect from '../../../hooks/useCustomEffect';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, FormEvent, useState } from 'react';
import { IEntryEdit, IEntryNew } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import ElviraInput from '../../../components/common/ElviraInput';
import { IoRemoveCircle } from 'react-icons/io5';
import Button from '../../../components/common/Button';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { IoMdAdd } from 'react-icons/io';
import ConfigItem from '../../../components/common/ConfigItem';
import FeedMenu from '../../../components/feed/FeedMenu';
import { toast } from 'react-toastify';
import useEditEntry from '../../../hooks/api/entries/useEditEntry';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { setEditingEntryTitle } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryEdit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFeeds, setActiveFeeds] = useState<
    { title: string; id: string }[]
  >([]);

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
            language_code: entryDetail.language?.code ?? '',
            identifiers: entryDetail.identifiers,
            config: entryDetail.config,
            citation: entryDetail.citation,
            published_at: entryDetail.published_at,
            publisher: entryDetail.publisher,
            thumbnail: entryDetail.thumbnail,
          });
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
  const handleSummaryChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
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
  const handlePublishedAtChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      published_at: event.target.value, // Update the published at property
    }));
  };
  const handleLangChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEntry((prevEntry) => ({
      ...prevEntry!, // Preserve existing properties of entryForm
      language_code: event.target.value, // Update the lang property
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
      language_code: 'sk',
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
                  className='bg-gray border border-white w-40 md:h-full h-auto rounded-md'
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
                    <ElviraInput
                      onChange={handlePublishedAtChange}
                      placeholder={t('entry.wizard.publishedAt')}
                      value={entry.published_at ?? ''}
                    />
                    <ElviraInput
                      onChange={handleLangChange}
                      placeholder={t('entry.wizard.lang')}
                      value={entry.language_code ?? ''}
                    />
                    <ElviraInput
                      onChange={() => {}}
                      placeholder={t('entry.wizard.copies')}
                      value={''}
                    />
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
              <div className='flex flex-col flex-1 min-h-60 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
                <span>{t('entry.wizard.summary')}</span>
                <textarea
                  onChange={handleSummaryChange}
                  className='bg-white dark:bg-gray outline-none resize-none flex-1 p-2 rounded-md'
                  placeholder={t('entry.wizard.summary')}
                  value={entry.summary}
                />
              </div>
              <div className='flex flex-col min-h-96 flex-3 bg-zinc-100 dark:bg-darkGray rounded-md p-4 gap-2'>
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
