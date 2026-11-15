import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCheck,
  FiClipboard,
  FiDownload,
  FiFileText,
  FiPrinter,
} from 'react-icons/fi';
import { IAdminStatistics } from '../../../utils/interfaces/statistics';
import {
  CSV_KINDS,
  CsvKind,
  ReportMeta,
  dialectFor,
  downloadCsv,
  downloadJson,
} from './exportReport';
import { fmtCount, fmtHours, fmtPct } from './format';

interface Props {
  data: IAdminStatistics;
  meta: ReportMeta;
  onTrack: (what: string) => void;
  /** Lays the page out for paper, then opens the browser's print dialog (Save as PDF lives there). */
  onPrint: () => void;
  /** Open the menu from a keyboard shortcut. */
  openSignal?: number;
}

/** A plain-text digest for an e-mail or a chat message; numbers formatted for people, not machines. */
const useSummary = (data: IAdminStatistics, meta: ReportMeta) => {
  const { t } = useTranslation();
  const k = data.kpis;
  const s = 'administration.dashboard.export.summary';
  const busiest = data.titles.filter((d) => d.loans > 0).slice(0, 3);
  const waiting = data.titles
    .filter((d) => d.queued > 0)
    .sort((a, b) => b.holds_ratio - a.holds_ratio)
    .slice(0, 3);
  return () =>
    [
      t(`${s}.heading`, { from: data.period.from, to: data.period.to }) +
        (meta.demo ? ` [${t('administration.dashboard.demo')}]` : ''),
      '',
      `• ${t('administration.dashboard.kpi.loans.label')}: ${fmtCount(k.loans.value)} (${t(`${s}.previous`)} ${fmtCount(k.loans.previous)})`,
      `• ${t('administration.dashboard.kpi.active_readers.label')}: ${fmtCount(k.active_readers.value)} (${t(`${s}.previous`)} ${fmtCount(k.active_readers.previous)})`,
      `• ${t('administration.dashboard.kpi.utilization.label')}: ${fmtPct(k.utilization.value)} · ${t('administration.dashboard.kpi.utilization.now', { inUse: k.copies_in_use_now, total: k.copies_total })}`,
      `• ${t('administration.dashboard.kpi.hold_fulfillment.label')}: ${fmtPct(k.hold_fulfillment.value)}`,
      `• ${t('administration.dashboard.kpi.median_wait_hours.label')}: ${fmtHours(k.median_wait_hours.value)}`,
      '',
      busiest.length
        ? `${t(`${s}.busiest`)}: ${busiest.map((d) => `${d.title} (${fmtPct(d.utilization)})`).join('; ')}`
        : null,
      waiting.length
        ? `${t(`${s}.waiting`)}: ${waiting.map((d) => `${d.title} (${d.queued}/${d.copies})`).join('; ')}`
        : null,
      data.categories[0]
        ? `${t(`${s}.topCategory`)}: ${data.categories[0].title} (${data.categories[0].loans})`
        : null,
    ]
      .filter((l) => l !== null)
      .join('\n');
};

export default function ExportMenu({
  data,
  meta,
  onTrack,
  onPrint,
  openSignal,
}: Props) {
  const { t, i18n } = useTranslation();
  const dialect = dialectFor(i18n.language);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const summary = useSummary(data, meta);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (what: string, fn: () => void) => {
    fn();
    onTrack(what);
    if (what !== 'summary') setOpen(false);
  };

  const copySummary = () =>
    run('summary', () => {
      // Clipboard API needs a secure context; without it (or on refusal) nothing is claimed as copied.
      navigator.clipboard
        ?.writeText(summary())
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        })
        .catch(() => {});
    });

  const item =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700';

  return (
    <div
      ref={ref}
      className='relative print:hidden'
      data-guide='admin-dashboard-export'
    >
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className='inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
      >
        <FiDownload size={15} aria-hidden />
        {t('administration.dashboard.export.button')}
        <kbd className='hidden rounded border border-zinc-200 px-1 text-[10px] text-zinc-400 sm:inline dark:border-zinc-600'>
          E
        </kbd>
      </button>
      {open && (
        <div
          role='menu'
          className='absolute right-0 z-30 mt-1 w-72 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-800'
        >
          {meta.demo && (
            <p className='mb-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'>
              {t('administration.dashboard.export.demoWarning')}
            </p>
          )}
          <button
            role='menuitem'
            type='button'
            className={item}
            onClick={copySummary}
          >
            {copied ? (
              <FiCheck
                size={15}
                className='text-[color:var(--viz-good-text)]'
              />
            ) : (
              <FiClipboard size={15} />
            )}
            <span className='min-w-0 flex-1'>
              {copied
                ? t('administration.dashboard.export.copied')
                : t('administration.dashboard.export.copySummary')}
            </span>
          </button>
          <button
            role='menuitem'
            type='button'
            className={item}
            onClick={() => run('print', onPrint)}
          >
            <FiPrinter size={15} />
            <span className='flex-1'>
              {t('administration.dashboard.export.print')}
            </span>
            <kbd className='text-[10px] text-zinc-400'>P</kbd>
          </button>
          <div className='my-1 border-t border-zinc-100 dark:border-zinc-700' />
          <p className='px-2.5 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400'>
            {t('administration.dashboard.export.csvHeading')}
          </p>
          {CSV_KINDS.map((kind: CsvKind) => (
            <button
              key={kind}
              role='menuitem'
              type='button'
              className={item}
              onClick={() =>
                run(`csv-${kind}`, () => downloadCsv(data, meta, kind, dialect))
              }
            >
              <FiFileText size={15} />
              <span className='min-w-0 flex-1'>
                {t(`administration.dashboard.export.csv.${kind}`)}
                {kind === 'titles' && (
                  <span className='ml-1 text-xs text-zinc-400'>
                    ({data.titles.length})
                  </span>
                )}
              </span>
            </button>
          ))}
          <div className='my-1 border-t border-zinc-100 dark:border-zinc-700' />
          <button
            role='menuitem'
            type='button'
            className={item}
            onClick={() => run('json', () => downloadJson(data, meta))}
          >
            <FiDownload size={15} />
            <span className='flex-1'>
              {t('administration.dashboard.export.json')}
            </span>
          </button>
          <p className='px-2.5 pb-1 pt-1.5 text-[11px] leading-snug text-zinc-400'>
            {t('administration.dashboard.export.note')}
          </p>
        </div>
      )}
    </div>
  );
}
