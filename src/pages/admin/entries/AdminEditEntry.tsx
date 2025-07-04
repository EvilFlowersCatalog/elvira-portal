import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../components/buttons/Breadcrumb';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import Button from '../../../components/buttons/Button';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { toast } from 'react-toastify';
import useEditEntry from '../../../hooks/api/entries/useEditEntry';
import { ContentEditableEvent } from 'react-simple-wysiwyg';
import WYSIWYG from '../../../components/inputs/WYSIWYG';
import FileDropzone from '../../../components/dropzones/FileDropzone';
import ElviraTextarea from '../../../components/inputs/ElviraTextarea';
import IdentifiersPart from '../../../components/specific-page/admin-entry-page/IdentifiersPart';
import ConfigPart from '../../../components/specific-page/admin-entry-page/config-part/ConfigPart';
import AdditionalDataPart from '../../../components/specific-page/admin-entry-page/AdditionalDataPart';
import AuthorsPart from '../../../components/specific-page/admin-entry-page/AuthorsPart';
import FeedsPart from '../../../components/specific-page/admin-entry-page/FeedsPart';
import CategoriesPart from '../../../components/specific-page/admin-entry-page/CategoriesPart';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { setEditingEntryTitle, umamiTrack } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNewForm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stringImage, setStringImage] = useState<string>('');
  const [isFilesLoading, setIsFilesLoading] = useState<boolean>(false);

  const getEntryDetail = useGetEntryDetail();
  const navigate = useNavigate();
  const editEntry = useEditEntry();

  useEffect(() => {
    try {
      (async () => {
        setIsLoading(true);
        if (id) {
          const { response: entryDetail } = await getEntryDetail(id);
          setEditingEntryTitle(entryDetail.title);

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
            published_at: entryDetail.published_at,
            publisher: entryDetail.publisher,
            thumbnail: entryDetail.thumbnail,
            categories: entryDetail.categories,
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    umamiTrack('Upload Edited Entry Button', {
      entryId: id,
    });

    const newEntry: IEntryNew = {
      title: entry!.title,
      authors: entry!.authors,
      feeds: entry!.feeds.map((feed) => {
        return feed.id;
      }),
      summary: entry!.summary,
      language_code: entry!.language_code,
      config: entry!.config,
      categories: entry!.categories,
      identifiers: {
        doi: entry!.identifiers?.doi ?? '',
        isbn: entry!.identifiers?.isbn ?? '',
      },
      citation: entry!.citation ?? '',
      publisher: entry!.publisher,
      image: stringImage,
    };
    if (entry!.published_at) newEntry.published_at = entry!.published_at;

    if (!newEntry.image) {
      // If there is no image notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.image'));
    } else {
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
    }
  };

  return (
    <>
      <div className='flex flex-col w-full h-full overflow-auto'>
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
              <div className='flex flex-col flex-2 gap-4'>
                {/* First row, first column */}
                <div className='flex flex-col bg-zinc-100 dark:bg-darkGray p-4 rounded-md gap-4'>
                  {/* Identifiers */}
                  <IdentifiersPart entry={entry} setEntry={setEntry} />

                  {/* Configs */}
                  <ConfigPart entry={entry} setEntry={setEntry} />
                </div>

                {/* Second row, first column */}
                <AdditionalDataPart
                  entry={entry}
                  setEntry={setEntry}
                  stringImage={stringImage}
                  setStringImage={setStringImage}
                />

                {/* Third row, first column */}
                <div className='flex flex-col gap-4'>
                  {/* Authors */}
                  <AuthorsPart entry={entry} setEntry={setEntry} />

                  <div className='flex flex-col md:flex-row gap-4'>
                    {/* Feeds */}
                    <FeedsPart entry={entry} setEntry={setEntry} />

                    {/* Categories */}
                    <CategoriesPart entry={entry} setEntry={setEntry} />
                  </div>
                </div>
              </div>

              {/* Second column */}
              <div className='flex flex-col flex-3 gap-4'>
                {/* FILES */}
                <FileDropzone
                  entryId={id!}
                  isLoading={isFilesLoading}
                  setIsLoading={setIsFilesLoading}
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
                <Button type='submit'>{t('entry.wizard.edit')}</Button>
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
};

export default AdminEditEntry;
