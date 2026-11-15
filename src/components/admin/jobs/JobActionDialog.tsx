import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import ConfirmDialog from '../ConfirmDialog';
import { useJobAction, useJobsClient } from '../../../hooks/api/jobs/useJobs';
import { IJobApply } from '../../../utils/interfaces/jobs';
import { problemDetailMessage } from '../../../utils/problemDetail';

export type JobDialogAction = { type: 'apply'; body: IJobApply } | { type: 'cancel'; id: string };

interface Props {
  action: JobDialogAction | null;
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
}

/** What `?dry_run=true` says the apply would do, before anything is sent. */
function PlanPreview({ body }: { body: IJobApply }) {
  const { t } = useTranslation();
  const api = useJobsClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['jobs', 'plan', body],
    queryFn: ({ signal }) => api.plan(body, signal),
    staleTime: 0,
    gcTime: 0,
  });
  if (isLoading) return <p className="text-xs text-zinc-400">{t('administration.jobs.plan.checking')}</p>;
  if (isError || !data) return <p className="text-xs text-zinc-500">{t('administration.jobs.plan.unknown')}</p>;

  const look = {
    'would-run': { icon: <FiCheckCircle />, tone: 'text-greenText dark:text-green' },
    'would-block': { icon: <FiClock />, tone: 'text-amber-700 dark:text-amber-300' },
    refused: { icon: <FiXCircle />, tone: 'text-redText dark:text-red' },
  }[data.outcome] ?? { icon: <FiAlertTriangle />, tone: 'text-zinc-600' };

  return (
    <p className={`flex items-start gap-2 rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900/50 ${look.tone}`}>
      <span className="mt-0.5 shrink-0">{look.icon}</span>
      <span>
        <span className="font-medium">{t(`administration.jobs.plan.${data.outcome}`, { defaultValue: data.outcome })}</span>
        {data.reason && <span className="text-zinc-600 dark:text-zinc-300"> — {data.reason}</span>}
      </span>
    </p>
  );
}

/**
 * Confirms a job action. An apply first asks the catalog what it would do (`dry_run`), so the
 * reader sees "runs now", "waits because …" or "refused because …" before confirming.
 */
export default function JobActionDialog({ action, title, message, confirmLabel, destructive, onClose }: Props) {
  const { t } = useTranslation();
  const mutation = useJobAction();

  const confirm = async () => {
    if (!action) return;
    try {
      await mutation.mutateAsync(action);
      toast.success(action.type === 'cancel' ? t('administration.jobs.actions.cancelled') : t('administration.jobs.actions.applied'));
      onClose();
    } catch (error) {
      toast.error(problemDetailMessage(error, t('administration.jobs.actions.error')));
    }
  };

  return (
    <ConfirmDialog
      open={action !== null}
      title={title}
      message={
        <div className="flex flex-col gap-2.5">
          {message && <div>{message}</div>}
          {action?.type === 'apply' && <PlanPreview body={action.body} />}
        </div>
      }
      confirmLabel={confirmLabel}
      cancelLabel={t('administration.usersPage.cancel')}
      destructive={destructive}
      loading={mutation.isPending}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}
