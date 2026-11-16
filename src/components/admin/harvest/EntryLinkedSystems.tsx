import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiDownload, FiExternalLink, FiLink, FiUpload } from 'react-icons/fi';
import StatusChip from '../StatusChip';
import { useEntrySync } from '../../../hooks/api/harvest/useHarvest';
import { useInvalidateJobs, useJobsClient } from '../../../hooks/api/jobs/useJobs';
import useAuthContext from '../../../hooks/contexts/useAuthContext';
import { IEntrySyncSource } from '../../../utils/interfaces/harvest';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { fmtDateTime } from '../../../utils/func/adminDate';
import { problemDetailMessage } from '../../../utils/problemDetail';
import { MODE_VARIANT, SYNC_STATE_VARIANT } from './harvestFormat';

/**
 * "Linked systems" of a publication (#52, IP-034), for managers: every system the book is linked to — link-only
 * library catalogues too — with the record link, and for two-way sources the sync state, last sync, open conflicts,
 * and Push/Pull now (superusers: `POST /api/v1/jobs` is superuser-only). Renders nothing for an unlinked book.
 */
export default function EntryLinkedSystems({ entryId }: { entryId: string }) {
  const { t } = useTranslation();
  const { auth } = useAuthContext();
  const { data: sources = [], refetch } = useEntrySync(entryId);
  const jobs = useJobsClient();
  const invalidateJobs = useInvalidateJobs();
  const [busy, setBusy] = useState<string | null>(null);

  if (!sources.length) return null;

  const run = async (source: IEntrySyncSource, kind: 'harvest.push' | 'harvest.pull') => {
    setBusy(`${source.source_id}:${kind}`);
    try {
      await jobs.apply({ kind, subject_id: entryId, spec: { source: source.source_id } });
      toast.success(kind === 'harvest.push' ? t('entry.linked.pushStarted', { name: source.name }) : t('entry.linked.pullStarted', { name: source.name }));
      invalidateJobs();
      // The state moves once the job has run; look again shortly.
      window.setTimeout(() => refetch(), 4000);
    } catch (e) {
      toast.error(problemDetailMessage(e, t('entry.linked.jobError')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="entry-linked-title" className="flex flex-col gap-2">
      <h2 id="entry-linked-title" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        <FiLink size={14} />
        {t('entry.linked.title')}
      </h2>
      <ul className="flex flex-col gap-2">
        {sources.map((s) => (
          <li key={`${s.source_id}-${s.record_id}`} className="rounded-lg border border-zinc-200 p-2.5 text-sm dark:border-zinc-700">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link to={`${NAVIGATION_PATHS.adminHarvest}/${s.source_id}`} className="font-medium text-zinc-800 hover:underline dark:text-zinc-100">
                {s.name}
              </Link>
              <StatusChip variant={MODE_VARIANT[s.mode as keyof typeof MODE_VARIANT] ?? 'neutral'}>
                {t(`administration.harvest.mode.${s.mode}`, { defaultValue: s.mode })}
              </StatusChip>
              {s.sync_state && (
                <StatusChip variant={SYNC_STATE_VARIANT[s.sync_state] ?? 'neutral'}>{t(`administration.harvest.syncState.${s.sync_state}`)}</StatusChip>
              )}
            </div>
            {s.record_url ? (
              <a
                href={s.record_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primaryText hover:underline dark:text-primaryLight"
              >
                <FiExternalLink size={12} className="shrink-0" />
                <span className="truncate">{t('entry.linked.openRecord', { name: s.name })}</span>
              </a>
            ) : (
              <p className="mt-1 truncate font-mono text-xs text-zinc-500" title={s.record_id}>{s.record_id}</p>
            )}
            {s.mode === 'sync' && (
              <div className="mt-1.5 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{t('entry.linked.lastSynced', { when: fmtDateTime(s.last_synced_at) ?? t('entry.linked.never') })}</span>
                {s.sync_state === 'error' && s.message && <span className="text-redText dark:text-red">{s.message}</span>}
                {s.open_conflicts > 0 && (
                  <Link
                    to={`${NAVIGATION_PATHS.adminHarvestConflicts}?entry_id=${entryId}&source_id=${s.source_id}`}
                    className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                  >
                    {t('entry.linked.openConflicts', { count: s.open_conflicts })}
                  </Link>
                )}
                {auth?.isSuperUser && (
                  <div className="mt-1 flex gap-1.5">
                    {(['harvest.push', 'harvest.pull'] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        disabled={busy !== null}
                        onClick={() => run(s, kind)}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {kind === 'harvest.push' ? <FiUpload size={12} /> : <FiDownload size={12} />}
                        {busy === `${s.source_id}:${kind}` ? '…' : kind === 'harvest.push' ? t('entry.linked.push') : t('entry.linked.pull')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
