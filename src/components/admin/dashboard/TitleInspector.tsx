import { ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import {
  FiBookOpen,
  FiCompass,
  FiEdit2,
  FiExternalLink,
  FiList,
  FiUsers,
} from 'react-icons/fi';
import Drawer from '../Drawer';
import { ITitleStatistics } from '../../../utils/interfaces/statistics';
import { NAVIGATION_PATHS } from '../../../utils/interfaces/general/general';
import { entryPath } from '@/lib/links/paths';
import { Swatch } from '../../graph/LibraryMap';
import {
  dateLocale,
  fmtCount,
  fmtHours,
  fmtPct,
  fmtRatio,
  needsCopies,
} from './format';
import { Neighbour, SemanticIndex, spareOf, useSemanticsOn } from './semantic';

interface Props {
  entryId: string | null;
  titles: ITitleStatistics[];
  semantic: SemanticIndex | null;
  periodFrom: string;
  onClose: () => void;
  /** Walk to another title without closing the drawer. */
  onSelect: (id: string) => void;
  onTrack: (what: string) => void;
}

const Stat = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) => (
  <div className='rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700'>
    <div className='text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
      {label}
    </div>
    <div className='text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50'>
      {value}
    </div>
    {sub && (
      <div className='text-xs text-zinc-500 dark:text-zinc-400'>{sub}</div>
    )}
  </div>
);

type Verdict =
  'needsCopies' | 'dormant' | 'new' | 'saturated' | 'healthy' | 'open';

export default function TitleInspector({
  entryId,
  titles,
  semantic,
  periodFrom,
  onClose,
  onSelect,
  onTrack,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const SEMANTICS_ON = useSemanticsOn();
  const k = 'administration.dashboard.inspector';
  const stats = useMemo(
    () => titles.find((d) => d.entry_id === entryId) ?? null,
    [titles, entryId]
  );
  const node = entryId ? semantic?.nodes.get(entryId) : undefined;
  const title = stats?.title ?? node?.title ?? '';

  const verdict: Verdict = !stats
    ? 'open'
    : needsCopies(stats)
      ? 'needsCopies'
      : stats.loans === 0
        ? parseISO(stats.added_at) >= parseISO(periodFrom)
          ? 'new'
          : 'dormant'
        : stats.in_use >= stats.copies
          ? 'saturated'
          : 'healthy';

  const neighbours = entryId && semantic ? semantic.neighbours(entryId) : [];
  // What the neighbourhood is for depends on the title's situation.
  const ordered: Neighbour[] =
    verdict === 'needsCopies' || verdict === 'saturated'
      ? [...neighbours].sort(
          (a, b) =>
            Math.min(spareOf(b), 99) - Math.min(spareOf(a), 99) ||
            b.score - a.score
        )
      : verdict === 'dormant'
        ? [...neighbours].sort(
            (a, b) =>
              (b.stats?.loans ?? -1) - (a.stats?.loans ?? -1) ||
              b.score - a.score
          )
        : neighbours;
  const neighbourHeading =
    verdict === 'needsCopies' || verdict === 'saturated'
      ? t(`${k}.neighbours.substitutes`)
      : verdict === 'dormant'
        ? t(`${k}.neighbours.hotNearby`)
        : t(`${k}.neighbours.default`);

  const go = (what: string, path: string) => {
    onTrack(what);
    // Leaving the page; the inspector stays in history, so Back reopens it.
    navigate(path);
  };

  const shortcut =
    'flex items-center gap-2.5 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:border-primary hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700/50';

  return (
    <Drawer
      open={!!entryId}
      onClose={onClose}
      title={title}
      description={stats?.authors.join(', ') || undefined}
      width='max-w-lg'
    >
      <div className='viz-root space-y-5'>
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            verdict === 'needsCopies'
              ? 'bg-orange-50 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100'
              : verdict === 'dormant'
                ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200'
                : 'bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-100'
          }`}
        >
          {t(`${k}.verdict.${verdict}`, {
            queued: stats?.queued,
            copies: stats?.copies,
          })}
        </p>

        {stats && (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            <Stat
              label={t('administration.dashboard.col.utilization')}
              value={fmtPct(stats.utilization)}
            />
            <Stat
              label={t('administration.dashboard.col.inUse')}
              value={`${stats.in_use}/${stats.copies}`}
              sub={
                stats.queued
                  ? t('administration.dashboard.leaderboard.waiting', {
                      count: stats.queued,
                    })
                  : undefined
              }
            />
            <Stat
              label={t('administration.dashboard.col.loans')}
              value={fmtCount(stats.loans)}
              sub={`${fmtRatio(stats.turnover)} ${t(`${k}.perCopy`)}`}
            />
            <Stat
              label={t('administration.dashboard.col.avgLoan')}
              value={
                stats.avg_loan_days == null
                  ? '—'
                  : fmtHours(stats.avg_loan_days * 24)
              }
            />
            <Stat
              label={t('administration.dashboard.col.holdsRatio')}
              value={fmtRatio(stats.holds_ratio)}
            />
            <Stat
              label={t('administration.dashboard.col.lastLoan')}
              value={
                <span className='text-sm'>
                  {stats.last_loan_at
                    ? formatDistanceToNowStrict(parseISO(stats.last_loan_at), {
                        locale: dateLocale(i18n.language),
                        addSuffix: true,
                      })
                    : t('administration.dashboard.dormant.never')}
                </span>
              }
            />
          </div>
        )}

        {node && (
          <p className='flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400'>
            <Swatch cls={node.cls} />
            {t(`explore.classes.${node.cls}`)}
            {node.udc.length > 0 && (
              <span className='tabular-nums'>
                · UDC {node.udc.slice(0, 3).join(', ')}
              </span>
            )}
          </p>
        )}

        <section>
          <h3 className='mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
            {t(`${k}.shortcuts`)}
          </h3>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            <button
              type='button'
              className={shortcut}
              onClick={() =>
                go('edit', NAVIGATION_PATHS.adminEditEntries + entryId)
              }
            >
              <FiEdit2 size={15} /> {t(`${k}.edit`)}
            </button>
            <button
              type='button'
              className={shortcut}
              onClick={() =>
                entryId && go('public', entryPath(entryId))
              }
            >
              <FiExternalLink size={15} /> {t(`${k}.public`)}
            </button>
            {SEMANTICS_ON && node && (
              <button
                type='button'
                className={shortcut}
                onClick={() =>
                  go('explore', `${NAVIGATION_PATHS.explore}?focus=${entryId}`)
                }
              >
                <FiCompass size={15} /> {t(`${k}.explore`)}
              </button>
            )}
            {stats && stats.queued > 0 && (
              <button
                type='button'
                className={shortcut}
                onClick={() =>
                  go(
                    'reservations',
                    `${NAVIGATION_PATHS.adminLoans}?tab=reservations`
                  )
                }
              >
                <FiUsers size={15} /> {t(`${k}.reservations`)}
              </button>
            )}
            <button
              type='button'
              className={shortcut}
              onClick={() =>
                go(
                  'entries',
                  `${NAVIGATION_PATHS.adminEntries}?q=${encodeURIComponent(title)}`
                )
              }
            >
              <FiList size={15} /> {t(`${k}.inList`)}
            </button>
          </div>
        </section>

        {SEMANTICS_ON && (
          <section>
            <h3 className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
              {neighbourHeading}
            </h3>
            <p className='mb-2 text-xs text-zinc-500 dark:text-zinc-400'>
              {t(`${k}.neighbours.help`)}
            </p>
            {!semantic ? (
              <p className='text-sm text-zinc-500'>
                {t(`${k}.neighbours.unavailable`)}
              </p>
            ) : ordered.length === 0 ? (
              <p className='text-sm text-zinc-500'>
                {t(`${k}.neighbours.none`)}
              </p>
            ) : (
              <ul className='divide-y divide-zinc-100 dark:divide-zinc-700'>
                {ordered.slice(0, 8).map((n) => {
                  const spare = spareOf(n);
                  return (
                    <li key={n.id}>
                      <button
                        type='button'
                        onClick={() => {
                          onTrack('walk');
                          onSelect(n.id);
                        }}
                        className='group flex w-full items-center gap-2.5 py-2 text-left'
                      >
                        <Swatch cls={n.cls} />
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate text-sm text-zinc-800 group-hover:underline dark:text-zinc-100'>
                            {n.title}
                          </span>
                          <span className='block text-xs text-zinc-500 dark:text-zinc-400'>
                            {n.stats
                              ? t(`${k}.neighbours.lcp`, {
                                  spare: spare,
                                  copies: n.stats.copies,
                                  loans: n.stats.loans,
                                })
                              : t(`${k}.neighbours.open`)}
                            {n.stats &&
                              n.stats.queued > 0 &&
                              ` · ${t('administration.dashboard.leaderboard.waiting', { count: n.stats.queued })}`}
                          </span>
                        </span>
                        <span
                          className='shrink-0 text-[11px] tabular-nums text-zinc-400'
                          title={t(`${k}.neighbours.similarity`)}
                        >
                          {fmtPct(n.score)}
                        </span>
                        <FiBookOpen
                          size={14}
                          className='shrink-0 text-zinc-300 group-hover:text-zinc-500'
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
