import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { FiPlay, FiRefreshCw, FiRotateCw } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { useTriggerEncryption } from '../../../hooks/api/encryption/useEntryEncryption';
import useGetLicenses from '../../../hooks/api/licenses/useGetLicenses';
import { EncryptionState } from '../../../utils/interfaces/encryption';
import { problemDetailMessage } from '../../../utils/problemDetail';
import ConfirmDialog from '../ConfirmDialog';
import StatusChip, { StatusVariant } from '../StatusChip';

const ENCRYPTION_VARIANT: Record<EncryptionState, StatusVariant> = {
  registered: 'success',
  completed: 'info',
  pending: 'warning',
  failed: 'danger',
  not_started: 'warning',
  no_file: 'neutral',
  off: 'neutral',
};

export const EncryptionStatusChip = ({ state, title }: { state: EncryptionState; title?: string }) => {
  const { t } = useTranslation();
  return (
    <StatusChip variant={ENCRYPTION_VARIANT[state]} title={title}>
      {t(`administration.jobs.lcp.status.${state}`)}
    </StatusChip>
  );
};

const btn =
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40';
const btnPlain = 'border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700';
const btnDanger = 'border-red/30 text-redText hover:bg-red/10 dark:text-red';

/**
 * Shortcuts for one publication's LCP job, limited to what `POST …/encryption` can do:
 * start a missing job, replace a failed one, or (force) delete the job and its package and
 * encrypt again under a new content id. A plain re-send of a stuck job keeping its content id,
 * and the loan-safe re-encryption, exist only as MCP tools — the portal cannot reach those.
 */
export default function EncryptionControls({
  entryId,
  title,
  state,
  className,
  compact,
}: {
  entryId: string;
  title: string;
  state: EncryptionState | undefined;
  className?: string;
  /** Icon-only buttons (table rows); the label moves to the tooltip. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const trigger = useTriggerEncryption(entryId);
  const getLicenses = useGetLicenses();
  const [confirmForce, setConfirmForce] = useState(false);

  // Loans that ever used this publication's package: the new content id does not match them.
  const loans = useQuery({
    queryKey: ['entry-license-count', entryId],
    enabled: confirmForce,
    queryFn: async () => (await getLicenses({ user_mode: 'all', entry_id: entryId, limit: 1 })).metadata.total,
  });

  const run = async (force: boolean) => {
    try {
      await trigger.mutateAsync(force);
      toast.success(t('administration.jobs.lcp.queued', { title, interpolation: { escapeValue: false } }));
    } catch (error) {
      toast.error(problemDetailMessage(error, t('administration.jobs.lcp.queueError')));
    }
  };

  if (!state || state === 'off' || state === 'no_file') return null;
  const busy = trigger.isPending;

  const action = (key: 'start' | 'retry' | 'recreate', icon: React.ReactNode, onClick: () => void, danger = false) => {
    const label = t(`administration.jobs.lcp.${key}`);
    const hint = key === 'recreate' ? t('administration.jobs.lcp.recreateHint') : undefined;
    return (
      <button
        type="button"
        disabled={busy}
        aria-label={compact ? label : undefined}
        title={compact ? [label, hint].filter(Boolean).join(' — ') : hint}
        className={twMerge(btn, danger ? btnDanger : btnPlain, compact && 'px-1.5')}
        onClick={onClick}
      >
        {icon}
        {!compact && label}
      </button>
    );
  };

  return (
    <div className={twMerge('flex flex-wrap items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      {state === 'not_started' && action('start', <FiPlay size={12} />, () => run(false))}
      {state === 'failed' && action('retry', <FiRefreshCw size={12} />, () => run(false))}
      {(state === 'pending' || state === 'completed' || state === 'registered') &&
        action('recreate', <FiRotateCw size={12} />, () => setConfirmForce(true), true)}

      <ConfirmDialog
        open={confirmForce}
        title={t('administration.jobs.lcp.recreateConfirmTitle')}
        message={[
          t('administration.jobs.lcp.recreateConfirmBody', { title, interpolation: { escapeValue: false } }),
          loans.isLoading
            ? t('administration.jobs.lcp.loansChecking')
            : loans.data
              ? t('administration.jobs.lcp.loansWarning', { count: loans.data })
              : loans.isError
                ? t('administration.jobs.lcp.loansUnknown')
                : t('administration.jobs.lcp.loansNone'),
        ].join(' ')}
        confirmLabel={t('administration.jobs.lcp.recreate')}
        cancelLabel={t('administration.usersPage.cancel')}
        destructive
        onConfirm={() => {
          setConfirmForce(false);
          run(true);
        }}
        onCancel={() => setConfirmForce(false)}
      />
    </div>
  );
}
