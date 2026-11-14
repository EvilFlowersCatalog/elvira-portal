import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiAlertOctagon,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiLock,
} from 'react-icons/fi';
import { IStatisticsAttention } from '../../../utils/interfaces/statistics';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';

type Severity = 'critical' | 'serious' | 'warning';

interface Item {
  key: keyof IStatisticsAttention;
  severity: Severity;
  icon: ReactElement;
  /** Where the operator goes to fix it. (No API lists jobs by status yet, so encryption lands on all LCP jobs.) */
  target: string;
}

const RESERVATIONS = `${NAVIGATION_PATHS.adminLoans}?tab=reservations`;
const LCP_JOBS = NAVIGATION_PATHS.adminJobs;

// Ordered by severity: what blocks lending first.
const ITEMS: Item[] = [
  {
    key: 'encryption_failed',
    severity: 'critical',
    icon: <FiAlertOctagon size={18} />,
    target: LCP_JOBS,
  },
  {
    key: 'encryption_stuck',
    severity: 'serious',
    icon: <FiLock size={18} />,
    target: LCP_JOBS,
  },
  {
    key: 'claims_expiring_24h',
    severity: 'warning',
    icon: <FiClock size={18} />,
    target: RESERVATIONS,
  },
  {
    key: 'saturated_with_queue',
    severity: 'serious',
    icon: <FiLayers size={18} />,
    target: RESERVATIONS,
  },
];

const BAR: Record<Severity, string> = {
  critical: 'var(--viz-critical)',
  serious: 'var(--viz-serious)',
  warning: 'var(--viz-warning)',
};

interface Props {
  attention: IStatisticsAttention;
  onNavigate: (e: React.MouseEvent<HTMLButtonElement>, path: string) => void;
}

const AttentionStrip = ({ attention, onNavigate }: Props) => {
  const { t } = useTranslation();
  const open = ITEMS.filter((i) => attention[i.key] > 0);

  if (!open.length) {
    return (
      <div data-guide='admin-attention' className='viz-root flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
        <FiCheckCircle
          size={18}
          className='text-[color:var(--viz-good)]'
          aria-hidden
        />
        {t('administration.dashboard.attention.allClear')}
      </div>
    );
  }

  return (
    <div data-guide='admin-attention' className='viz-root grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {open.map((i) => (
        <button
          key={i.key}
          type='button'
          onClick={(e) => onNavigate(e, i.target)}
          className='group relative flex items-start gap-3 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 pl-5 text-left shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800'
        >
          <span
            className='absolute inset-y-0 left-0 w-1'
            style={{ background: BAR[i.severity] }}
            aria-hidden
          />
          <span className='mt-0.5 text-zinc-700 dark:text-zinc-200' aria-hidden>
            {i.icon}
          </span>
          <span className='min-w-0'>
            <span className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold text-zinc-900 dark:text-zinc-50'>
                {attention[i.key]}
              </span>
              <span className='text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
                {t(`administration.dashboard.attention.severity.${i.severity}`)}
              </span>
            </span>
            <span className='block text-sm font-medium text-zinc-800 dark:text-zinc-100'>
              {t(`administration.dashboard.attention.${i.key}.label`, {
                count: attention[i.key],
              })}
            </span>
            <span className='block text-xs text-zinc-500 dark:text-zinc-400'>
              {t(`administration.dashboard.attention.${i.key}.action`)}
            </span>
          </span>
        </button>
      ))}
      {attention.lcp_not_lendable >
        attention.encryption_failed + attention.encryption_stuck && (
        <div className='flex items-center gap-2 text-xs text-zinc-500 sm:col-span-2 xl:col-span-4 dark:text-zinc-400'>
          <FiAlertTriangle size={14} aria-hidden />
          {t('administration.dashboard.attention.notLendable', {
            count: attention.lcp_not_lendable,
          })}
        </div>
      )}
    </div>
  );
};

export default AttentionStrip;
