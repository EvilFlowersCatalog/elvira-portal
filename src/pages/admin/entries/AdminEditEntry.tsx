import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { config } from '@/lib/config';
import useGetEntryDetail from '../../../hooks/api/entries/useGetEntryDetail';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { IEntryNew, IEntryNewForm } from '../../../utils/interfaces/entry';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../../hooks/contexts/useAppContext';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { withRememberedSearch } from '../../../utils/func/listSearch';
import { toast } from 'react-toastify';
import useEditEntry from '../../../hooks/api/entries/useEditEntry';
import AdminEntryForm from './AdminEntryForm';
import { localize } from '../../../utils/func/localized';
import { identifiersPayload } from '../../../utils/func/identifiers';
import { fieldError, problemDetailMessage } from '../../../utils/problemDetail';

const AdminEditEntry = () => {
  const { t } = useTranslation();
  const { setEditingEntryTitle, umamiTrack } = useAppContext();
  const { 'entry-id': id } = useParams();
  const [entry, setEntry] = useState<IEntryNewForm | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stringImage, setStringImage] = useState<string>('');
  const [entryCatalogId, setEntryCatalogId] = useState<string | null>(null);
  // IP-034: read-only facts of the stored entry, for the banner and the "Imported from" label.
  const [origin, setOrigin] = useState<string>('elvira');
  const [withdrawnAt, setWithdrawnAt] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const { getEntryDetail } = useGetEntryDetail();
  const navigate = useNavigate();
  // Search/filters/page of the entries list we came from, so saving returns to it.
  // Opened without that state (direct link, new tab): the list as it was last left.
  const listSearch = (useLocation().state as { from?: string } | null)?.from;
  const listPath =
    listSearch != null ? NAVIGATION_PATHS.adminEntries + listSearch : withRememberedSearch(NAVIGATION_PATHS.adminEntries);
  const editEntry = useEditEntry();

  useEffect(() => {
    // try/catch must live INSIDE the async fn — awaited rejections never reach a
    // try wrapped around a fire-and-forget IIFE.
    (async () => {
      setIsLoading(true);
      try {
        if (id) {
          const entryDetail = await getEntryDetail(id, config.ELVIRA_CATALOG_ID || undefined);
          setEditingEntryTitle(entryDetail.title);
          setStringImage(entryDetail.thumbnail || '');
          setEntryCatalogId(entryDetail.catalog_id);
          setOrigin(entryDetail.origin || 'elvira');
          setWithdrawnAt(entryDetail.withdrawn_at ?? null);

          setEntry({
            title: entryDetail.title,
            authors: entryDetail.authors,
            feeds: entryDetail.feeds.map((feed) => ({
              title: localize(feed.title),
              id: feed.id,
            })),
            summary: entryDetail.summary,
            language_code:
              entryDetail.language?.alpha3 ?? entryDetail.language?.alpha2,
            // Every key, not only DOI/ISBN: the external-system keys link the book to other systems (IP-034).
            identifiers: {
              ...(entryDetail.identifiers ?? {}),
              doi: entryDetail.identifiers?.doi ?? '',
              isbn: entryDetail.identifiers?.isbn ?? '',
            },
            edition: entryDetail.edition ?? '',
            config: entryDetail.config,
            citation: entryDetail.citation,
            published_at: entryDetail.published_at,
            publisher: entryDetail.publisher,
            thumbnail: entryDetail.thumbnail ?? undefined,
            categories: entryDetail.categories,
          });
        }
      } catch {
        setEntry(null);
        navigate(NAVIGATION_PATHS.adminHome, { replace: true });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);


  /** The whole entry as the PUT wants it (title and language are required on every update). */
  const buildPayload = (): IEntryNew => {
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
      // All keys: sending only DOI/ISBN dropped `arl_stu`, `dataverse_pid` … and unlinked the book on every save.
      identifiers: identifiersPayload(entry!.identifiers),
      citation: entry!.citation ?? '',
      publisher: entry!.publisher,
      edition: entry!.edition?.trim() || null,
      image: stringImage,
    };
    if (entry!.published_at) newEntry.published_at = entry!.published_at;
    return newEntry;
  };

  /** Withdraw (hide, refuse new loans) or restore, without leaving the form; running loans continue. */
  const setWithdrawn = async (withdrawn: boolean) => {
    if (!entry || !id) return;
    setIsWithdrawing(true);
    try {
      await editEntry(id, { ...buildPayload(), withdrawn }, entryCatalogId || config.ELVIRA_CATALOG_ID || undefined);
      setWithdrawnAt(withdrawn ? new Date().toISOString() : null);
      toast.success(withdrawn ? t('entry.withdrawal.withdrawn') : t('entry.withdrawal.restored'));
    } catch (e) {
      toast.error(problemDetailMessage(e, t('entry.withdrawal.error')));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    umamiTrack('Upload Edited Entry Button', {
      entryId: id,
    });

    const newEntry = buildPayload();

    if (!newEntry.image) {
      // If there is no image notify that it is needed
      toast.warning(t('entry.wizard.requiredMessages.image'));
    } else {
      // Upload
      try {
        setIsLoading(true);
        await editEntry(id!, newEntry, entryCatalogId || config.ELVIRA_CATALOG_ID || undefined);
        toast.success(t('notifications.entry.edit.success'));
        navigate(listPath, { replace: true });
      } catch (error) {
        // An unknown identifier key is a 422 naming `identifiers`; say so instead of a bare "failed".
        toast.error(fieldError(error, 'identifiers') ?? problemDetailMessage(error, t('notifications.entry.edit.error')));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AdminEntryForm
      FormType='edit'
      handleSubmit={handleSubmit}
      entry={entry}
      setEntry={setEntry}
      isLoading={isLoading}
      stringImage={stringImage}
      setStringImage={setStringImage}
      catalogId={entryCatalogId || undefined}
      stored={{ origin, withdrawnAt, onWithdraw: setWithdrawn, isWithdrawing }}
    />
  );
};

export default AdminEditEntry;
