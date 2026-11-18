import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RiExternalLinkLine } from 'react-icons/ri';
import useAppContext from '../../../../hooks/contexts/useAppContext';
import useEntryDialog from '../../../../hooks/useEntryDialog';
import { invalidateEntry } from '../../../../hooks/api/entries/entryQueries';
import { entryPath } from '@/lib/links/paths';
import DetailModal from '../../../modals/DetailModal';
import EntryDetailContent from './EntryDetailContent';
import LicenseCalendar from './LicenseCalendar';

/**
 * The publication dialog for the whole portal, mounted once in App (like the assistant), so a link with
 * `?entry-detail-id=` opens it on any page — the reader, Explore and the assistant page included — and the
 * borrow dialog (`licensing-entry-id`) is reachable from all of them. Pages no longer mount their own copy.
 */
const EntryDialogHost = () => {
  const { t } = useTranslation();
  const { umamiTrack } = useAppContext();
  const { entryId, catalogId, tab, close, setTab } = useEntryDialog();
  const [searchParams] = useSearchParams();

  // The borrow dialog closing for a publication means its loan may have changed: refetch it wherever shown.
  const licensing = searchParams.get('licensing-entry-id');
  const previousLicensing = useRef<string | null>(null);
  useEffect(() => {
    if (previousLicensing.current && !licensing) void invalidateEntry(previousLicensing.current);
    previousLicensing.current = licensing;
  }, [licensing]);

  return (
    <>
      {entryId && (
        <DetailModal
          title={t('entry.detail.title')}
          onClose={() => {
            umamiTrack('Close Entry Detail Button');
            close();
          }}
          isOpen
          zIndex={50}
          actions={
            <Link
              to={entryPath(entryId, { tab, catalogId })}
              className="flex items-center gap-1 text-sm text-secondary dark:text-secondaryLight hover:underline"
              title={t('links.openPage')}
            >
              <RiExternalLinkLine size={20} />
              <span className="hidden sm:inline">{t('links.openPage')}</span>
            </Link>
          }
        >
          <EntryDetailContent
            key={entryId}
            entryId={entryId}
            catalogId={catalogId}
            tab={tab}
            onTabChange={setTab}
            variant="dialog"
          />
        </DetailModal>
      )}
      <LicenseCalendar />
    </>
  );
};

export default EntryDialogHost;
