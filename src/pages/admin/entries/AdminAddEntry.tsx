import { useNavigate } from 'react-router-dom';
import { ChangeEvent, FormEvent, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { toast } from 'react-toastify';
import useUploadEntry from '../../../hooks/api/entries/useUploadEntry';
import useCreateEntryAcquistion from '../../../hooks/api/acquisitiions/useCreateEntryAcquistion';
import useAppContext from '../../../hooks/contexts/useAppContext';
import AdminEntryForm from './AdminEntryForm';

const AdminAddEntry = () => {
  const { umamiTrack } = useAppContext();
  const { t } = useTranslation();

  const [entry, setEntry] = useState<IEntryNewForm | null>({
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
  const [files, setFiles] = useState<
    { id: string; relation: string; file: File }[]
  >([]);

  const navigate = useNavigate();
  const uploadEntry = useUploadEntry();
  const createEntryAcquisition = useCreateEntryAcquistion();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    umamiTrack('Upload Created Entry Button');

    if (!entry) return;

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
        const info = await uploadEntry(newEntry);

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

  return AdminEntryForm({
    FormType: 'add',
    handleSubmit,
    entry,
    setEntry,
    isLoading,
    stringImage,
    setStringImage,
    files,
    setFiles,
  });
};

export default AdminAddEntry;
