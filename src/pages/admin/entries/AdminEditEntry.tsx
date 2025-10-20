import { useNavigate, useParams } from 'react-router-dom';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { toast } from 'react-toastify';
import useEditEntry from '../../../hooks/api/entries/useEditEntry';
import AdminEntryForm from './AdminEntryForm';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { setEditingEntryTitle, umamiTrack } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNewForm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stringImage, setStringImage] = useState<string>('');

  const getEntryDetail = useGetEntryDetail();
  const navigate = useNavigate();
  const editEntry = useEditEntry();

  useEffect(() => {
    try {
      (async () => {
        setIsLoading(true);
        if (id) {
          const entryDetail  = await getEntryDetail(id);
          setEditingEntryTitle(entryDetail.title);
          setStringImage(entryDetail.thumbnail || '');

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

  return AdminEntryForm({
    FormType: 'edit',
    handleSubmit,
    entry,
    setEntry,
    isLoading,
    stringImage,
    setStringImage
  });
};

export default AdminEditEntry;
