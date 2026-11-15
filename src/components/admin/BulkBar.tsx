import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { BulkFailure, BulkState } from '../../hooks/useBulkRunner';

const strip = 'mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-sm';
const linkBtn = 'font-medium text-primaryText hover:underline disabled:opacity-40 dark:text-primaryLight';

export const bulkBtn =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700';
export const bulkBtnDanger =
  'inline-flex items-center gap-1.5 rounded-md border border-red/30 bg-white px-2.5 py-1 text-xs font-medium text-redText hover:bg-red/10 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-800 dark:text-red';

interface BulkBarProps {
  /** Rows ticked by hand (all pages). */
  count: number;
  /** "Every row matching the filter" is selected instead of the ticked ones. */
  allMatching: boolean;
  /** Rows matching the current filter. */
  total: number;
  /** Cap of a whole-filter run. */
  cap: number;
  /** Offer "select all N matching" (every selectable row of the page is ticked and more exist). */
  canSelectAllMatching: boolean;
  onSelectAllMatching: () => void;
  onClear: () => void;
  /** The action buttons. */
  actions: ReactNode;
  run: BulkState;
  /** Label of each action key, for the progress and summary lines. */
  actionLabels: Record<string, string>;
  onCancel: () => void;
  onDismiss: () => void;
  /** Tick the rows that failed, to act on them again. */
  onSelectFailed?: (failed: BulkFailure[]) => void;
}

/**
 * Selection, progress and outcome of bulk actions above an admin table: how many rows are
 * selected (and the step up to the whole filter), the actions, a progress bar while requests
 * run, and a summary that lists every failure with the catalog's reason.
 */
export default function BulkBar({
  count,
  allMatching,
  total,
  cap,
  canSelectAllMatching,
  onSelectAllMatching,
  onClear,
  actions,
  run,
  actionLabels,
  onCancel,
  onDismiss,
  onSelectFailed,
}: BulkBarProps) {
  const { t } = useTranslation();
  const [showFailures, setShowFailures] = useState(false);
  const action = run.action ? actionLabels[run.action] ?? run.action : '';
  const busy = run.phase === 'collecting' || run.phase === 'running';
  const settled = run.done + run.skipped + run.failed.length;
  const listed = run.failed.filter((f) => f.id);

  return (
    <>
      {busy && (
        <div className={twMerge(strip, 'border-primary/30 bg-primaryLight/30 dark:border-primaryLight/20 dark:bg-primaryDark/20')} role="status" aria-live="polite">
          <span className="font-medium text-zinc-800 dark:text-zinc-100">{action}</span>
          <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
            {run.phase === 'collecting'
              ? t('administration.bulk.collecting')
              : t('administration.bulk.progress', { settled, total: run.total })}
            {run.skipped > 0 && ` · ${t('administration.bulk.skipped', { count: run.skipped })}`}
            {run.failed.length > 0 && ` · ${t('administration.bulk.failed', { count: run.failed.length })}`}
          </span>
          <span
            className="h-1.5 min-w-24 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={run.total || 1}
            aria-valuenow={settled}
          >
            {run.phase === 'collecting' ? (
              <span className="block h-full w-1/3 animate-[loadingbar_1s_ease-in-out_infinite] bg-primary" />
            ) : (
              <span className="block h-full bg-primary transition-[width]" style={{ width: `${run.total ? (settled / run.total) * 100 : 0}%` }} />
            )}
          </span>
          <button type="button" className={linkBtn} onClick={onCancel}>
            {t('administration.bulk.cancel')}
          </button>
        </div>
      )}

      {run.phase === 'finished' && (
        <div
          className={twMerge(
            strip,
            run.failed.length
              ? 'border-amber-400/50 bg-amber-400/10 dark:border-amber-400/30'
              : 'border-greenText/30 bg-green/10 dark:border-green/30'
          )}
          role="status"
        >
          {run.failed.length ? (
            <FiAlertTriangle className="shrink-0 text-amber-600 dark:text-amber-300" />
          ) : (
            <FiCheckCircle className="shrink-0 text-greenText dark:text-green" />
          )}
          <span className="text-zinc-800 dark:text-zinc-100">
            <span className="font-medium">{action}</span>
            {': '}
            {[
              t('administration.bulk.summaryDone', { count: run.done }),
              run.skipped > 0 && t('administration.bulk.summarySkipped', { count: run.skipped }),
              run.failed.length > 0 && t('administration.bulk.failed', { count: run.failed.length }),
            ]
              .filter(Boolean)
              .join(', ')}
            {run.cancelled && ` — ${t('administration.bulk.cancelled')}`}
          </span>
          {listed.length > 0 && (
            <button type="button" className={linkBtn} onClick={() => setShowFailures((v) => !v)} aria-expanded={showFailures}>
              {showFailures ? t('administration.bulk.hideFailures') : t('administration.bulk.showFailures')}
            </button>
          )}
          {listed.length > 0 && onSelectFailed && (
            <button type="button" className={linkBtn} onClick={() => onSelectFailed(listed)}>
              {t('administration.bulk.selectFailed')}
            </button>
          )}
          <button
            type="button"
            className="ml-auto rounded p-1 text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-700"
            aria-label={t('administration.bulk.dismiss')}
            onClick={() => {
              setShowFailures(false);
              onDismiss();
            }}
          >
            <FiX size={14} />
          </button>
          {/* A failure without an item is the gathering step itself failing. */}
          {run.failed.some((f) => !f.id) && (
            <p className="basis-full text-xs text-redText dark:text-red">{run.failed.find((f) => !f.id)!.message}</p>
          )}
          {showFailures && (
            <ul className="basis-full max-h-56 overflow-y-auto rounded-md border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900/60">
              {listed.map((f) => (
                <li key={f.id} className="flex flex-col gap-0.5 border-b border-zinc-100 px-3 py-1.5 last:border-0 dark:border-zinc-700/60 sm:flex-row sm:gap-3">
                  <span className="font-medium text-zinc-800 dark:text-zinc-100 sm:w-2/5 sm:truncate" title={f.label}>
                    {f.label}
                  </span>
                  <span className="text-redText dark:text-red">{f.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!busy && (count > 0 || allMatching) && (
        <div className={twMerge(strip, 'border-primary/40 bg-primaryLight/40 dark:border-primaryLight/20 dark:bg-primaryDark/30')}>
          <span className="font-medium text-zinc-800 dark:text-zinc-100" aria-live="polite">
            {allMatching
              ? total > cap
                ? t('administration.bulk.allMatchingCapped', { count: total, cap })
                : t('administration.bulk.allMatching', { count: total })
              : t('administration.bulk.selected', { count })}
          </span>
          {!allMatching && canSelectAllMatching && total > count && (
            <button type="button" className={linkBtn} onClick={onSelectAllMatching}>
              {t('administration.bulk.selectAllMatching', { count: total })}
            </button>
          )}
          <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
          <button type="button" className={twMerge(linkBtn, 'ml-auto')} onClick={onClear}>
            {t('administration.bulk.clear')}
          </button>
        </div>
      )}
    </>
  );
}
