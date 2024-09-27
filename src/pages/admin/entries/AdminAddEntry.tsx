import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../../components/buttons/Breadcrumb';
import { ChangeEvent, FormEvent, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import PageLoading from '../../../components/page/PageLoading';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/buttons/Button';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { toast } from 'react-toastify';
import { ContentEditableEvent } from 'react-simple-wysiwyg';
import WYSIWYG from '../../../components/inputs/WYSIWYG';
import FileDropzone from '../../../components/dropzones/FileDropzone';
import ElviraTextarea from '../../../components/inputs/ElviraTextarea';
import useUploadEntry from '../../../hooks/api/entries/useUploadEntry';
import useCreateEntryAcquistion from '../../../hooks/api/acquisitiions/useCreateEntryAcquistion';
import CategoriesPart from '../../../components/specific-page/admin-entry-page/CategoriesPart';
import FeedsPart from '../../../components/specific-page/admin-entry-page/FeedsPart';
import AuthorsPart from '../../../components/specific-page/admin-entry-page/AuthorsPart';
import AdditionalDataPart from '../../../components/specific-page/admin-entry-page/AdditionalDataPart';
import ConfigPart from '../../../components/specific-page/admin-entry-page/config-part/ConfigPart';
import IdentifiersPart from '../../../components/specific-page/admin-entry-page/IdentifiersPart';

const AdminAddEntry = () => {
  const { t } = useTranslation();

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stringImage, setStringImage] = useState<string>('');
  const [isFilesLoading, setIsFilesLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<
    { id: string; relation: string; file: File }[]
  >([]);

  const navigate = useNavigate();
  const uploadEntry = useUploadEntry();
  const createEntryAcquisition = useCreateEntryAcquistion();

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    umami.track('Upload Created Entry Button');

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
                  files={files}
                  setFiles={setFiles}
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
                <Button type='submit' title={t('entry.wizard.upload')} />
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
};

export default AdminAddEntry;
