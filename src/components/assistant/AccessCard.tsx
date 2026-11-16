import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiLock, FiLogIn, FiBookOpen, FiWifi } from 'react-icons/fi';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useOpenEntryDetail from '../../hooks/api/assistant/useOpenEntryDetail';
import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { IAssistantAccess } from '../../utils/interfaces/assistant';

const REASONS = ['lcp', 'budget'];

const button =
  'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-zinc-300 text-gray-800 hover:border-primary hover:text-primary disabled:opacity-50 dark:border-zinc-600 dark:text-gray-100 dark:hover:border-primaryLight dark:hover:text-primaryLight';

/**
 * "Read more of this publication" (EvilFlowersCatalog#186 `access` frame, elvira-portal#49): a tool of the turn
 * had to withhold a publication's text, so instead of the model explaining licensing in prose the reader gets the
 * next step — sign in, borrow (in the detail), or read from the university network. Live only.
 */
export default function AccessCard({ access, onNavigate }: { access: IAssistantAccess; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getEntryDetail } = useGetEntryDetail();
  const openEntryDetail = useOpenEntryDetail();
  const [opening, setOpening] = useState(false);

  const ways = access.how_to_unlock;
  const reason = REASONS.includes(access.reason ?? '') ? access.reason : 'other';

  // Borrowing happens in the detail, which needs the publication's catalog.
  const openDetail = async () => {
    setOpening(true);
    const entry = await getEntryDetail(access.entry_id).catch(() => null);
    setOpening(false);
    if (!entry) return;
    onNavigate?.();
    openEntryDetail(access.entry_id, entry.catalog_id);
  };
  const signIn = () => {
    onNavigate?.();
    navigate(NAVIGATION_PATHS.login);
  };

  return (
    <section
      aria-label={t('assistant.access.label')}
      className="flex flex-col gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs"
    >
      <p className="flex items-start gap-1.5 text-black dark:text-white">
        <FiLock size={13} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
        <span className="min-w-0">
          {access.title ? <span className="font-medium">{access.title}: </span> : null}
          {t(`assistant.access.reason.${reason}`)}
        </span>
      </p>
      {ways.includes('campus_network') ? (
        <p className="flex items-start gap-1.5 pl-5 text-gray-600 dark:text-gray-300">
          <FiWifi size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('assistant.access.campusNetwork')}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pl-5">
        {ways.includes('sign_in') ? (
          <button type="button" onClick={signIn} className={button}>
            <FiLogIn size={12} aria-hidden="true" /> {t('assistant.access.signIn')}
          </button>
        ) : null}
        <button type="button" onClick={openDetail} disabled={opening} className={button}>
          <FiBookOpen size={12} aria-hidden="true" />
          {t(ways.includes('borrow') ? 'assistant.access.borrow' : 'assistant.access.detail')}
        </button>
      </div>
    </section>
  );
}
