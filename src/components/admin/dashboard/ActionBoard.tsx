import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiCornerUpRight,
  FiMoon,
  FiShoppingCart,
  FiTrendingUp,
} from 'react-icons/fi';
import { ChartCard } from './ChartCard';
import {
  ACTION_KINDS,
  ActionKind,
  Neighbour,
  SemanticIndex,
  spareOf,
  TitleAction,
} from './semantic';

const SHOWN = 4;

const ICON: Record<ActionKind, typeof FiShoppingCart> = {
  buy: FiShoppingCart,
  redirect: FiCornerUpRight,
  promote: FiTrendingUp,
  review: FiMoon,
};

/** Accent strip per column: urgency, not identity, so status tokens. */
const ACCENT: Record<ActionKind, string> = {
  buy: 'border-t-[color:var(--viz-critical)]',
  redirect: 'border-t-[color:var(--viz-warning)]',
  promote: 'border-t-[color:var(--viz-s1)]',
  review: 'border-t-[color:var(--viz-muted)]',
};

/**
 * "What should change?" — every LCP title that needs a decision, sorted by what the library graph
 * says relieves it. Waiting readers with nothing similar free → buy copies; with something similar
 * free → redirect them. Unused titles next to borrowed ones → promote them there; unused titles in
 * a quiet neighbourhood → question the licence at renewal.
 */
export default function ActionBoard({
  semantic,
  highlight,
  onHover,
  onOpen,
  onTrack,
}: {
  semantic: SemanticIndex;
  highlight: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onTrack: (what: string) => void;
}) {
  const { t } = useTranslation();
  const k = 'administration.dashboard.actions';
  const [expanded, setExpanded] = useState<ActionKind | null>(null);
  const a = semantic.actions;

  const viaText = (n: Neighbour) =>
    n.stats
      ? t(`${k}.spare`, { count: spareOf(n), copies: n.stats.copies })
      : t(`${k}.free`);

  const detail = (item: TitleAction) => {
    const s = item.stats;
    switch (item.kind) {
      case 'buy':
      case 'redirect':
        return t(`${k}.${item.kind}.item`, {
          queued: s.queued,
          copies: s.copies,
          count: s.copies,
        });
      case 'promote':
        return t(`${k}.promote.item`, { count: s.copies });
      case 'review':
        return t(`${k}.review.item`, { count: s.copies });
    }
  };

  const insightParts = [
    a.buy.length > 0 && t(`${k}.insightBuy`, { count: a.buy.length }),
    a.redirect.length > 0 &&
      t(`${k}.insightRedirect`, { count: a.redirect.length }),
    a.promote.length + a.review.length > 0 &&
      t(`${k}.insightUnused`, {
        count: a.promote.length + a.review.length,
        promote: a.promote.length,
      }),
  ].filter(Boolean);

  return (
    <ChartCard
      title={t(`${k}.title`)}
      description={t(`${k}.description`)}
      insight={insightParts.length ? insightParts.join(' ') : t(`${k}.insightNone`)}
      table={{
        columns: [t(`${k}.col.action`), t('administration.dashboard.col.title'), t(`${k}.col.detail`), t(`${k}.col.via`)],
        rows: ACTION_KINDS.flatMap((kind) =>
          a[kind].map((item) => [
            t(`${k}.${kind}.title`),
            item.stats.title,
            detail(item),
            item.via
              .slice(0, 3)
              .map((n) => `${n.title} (${kind === 'promote' ? t(`${k}.loans`, { count: n.stats!.loans }) : viaText(n)})`)
              .join('; '),
          ])
        ),
      }}
    >
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
        {ACTION_KINDS.map((kind) => {
          const Icon = ICON[kind];
          const items = a[kind];
          const shown = expanded === kind ? items : items.slice(0, SHOWN);
          return (
            <section
              key={kind}
              aria-labelledby={`action-${kind}`}
              className={`flex flex-col rounded-lg border border-t-4 border-zinc-200 p-3 dark:border-zinc-700 ${ACCENT[kind]}`}
            >
              <header className='mb-1 flex items-center gap-2'>
                <Icon size={15} aria-hidden className='shrink-0 text-zinc-500 dark:text-zinc-400' />
                <h4
                  id={`action-${kind}`}
                  className='flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50'
                >
                  {t(`${k}.${kind}.title`)}
                </h4>
                <span className='text-lg font-bold text-zinc-900 dark:text-zinc-50'>
                  {items.length}
                </span>
              </header>
              <p className='mb-2 text-xs text-zinc-500 dark:text-zinc-400'>
                {t(`${k}.${kind}.why`)}
              </p>
              {items.length === 0 ? (
                <p className='mt-auto rounded-md bg-zinc-50 px-2.5 py-2 text-xs text-zinc-500 dark:bg-zinc-700/40 dark:text-zinc-400'>
                  {t(`${k}.${kind}.empty`)}
                </p>
              ) : (
                <ul className='space-y-2'>
                  {shown.map((item) => (
                    <li
                      key={item.id}
                      className={`rounded-md px-2 py-1.5 ${highlight === item.id ? 'bg-zinc-100 dark:bg-zinc-700/60' : ''}`}
                    >
                      <button
                        type='button'
                        onClick={() => {
                          onTrack(`action-${kind}`);
                          onOpen(item.id);
                        }}
                        onPointerEnter={() => onHover(item.id)}
                        onPointerLeave={() => onHover(null)}
                        onFocus={() => onHover(item.id)}
                        onBlur={() => onHover(null)}
                        className='block w-full text-left'
                      >
                        <span className='line-clamp-2 text-sm font-medium text-zinc-800 hover:underline dark:text-zinc-100'>
                          {item.stats.title}
                        </span>
                        <span className='block text-xs tabular-nums text-zinc-500 dark:text-zinc-400'>
                          {detail(item)}
                        </span>
                      </button>
                      {(kind === 'redirect' || kind === 'promote') && item.via[0] && (
                        <button
                          type='button'
                          onClick={() => {
                            onTrack(`action-${kind}-via`);
                            onOpen(item.via[0].id);
                          }}
                          onPointerEnter={() => onHover(item.via[0].id)}
                          onPointerLeave={() => onHover(null)}
                          className='mt-1 flex w-full items-start gap-1.5 rounded border border-zinc-200 px-2 py-1 text-left text-xs hover:border-primary dark:border-zinc-600'
                        >
                          <span className='shrink-0 text-zinc-400'>
                            {kind === 'redirect' ? '→' : '↔'}
                          </span>
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate text-zinc-800 dark:text-zinc-100'>
                              {item.via[0].title}
                            </span>
                            <span className='block text-zinc-500 dark:text-zinc-400'>
                              {kind === 'redirect'
                                ? viaText(item.via[0])
                                : t(`${k}.loans`, { count: item.via[0].stats!.loans })}
                              {item.via.length > 1 &&
                                ` · ${t(`${k}.moreVia`, { count: item.via.length - 1 })}`}
                            </span>
                          </span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {items.length > SHOWN && (
                <button
                  type='button'
                  aria-expanded={expanded === kind}
                  onClick={() => setExpanded(expanded === kind ? null : kind)}
                  className='mt-2 self-start text-xs font-medium text-primaryText hover:underline dark:text-primaryLight'
                >
                  {expanded === kind
                    ? t(`${k}.less`)
                    : t(`${k}.more`, { count: items.length - SHOWN })}
                </button>
              )}
            </section>
          );
        })}
      </div>
      {semantic.uncovered.length > 0 && (
        <p className='mt-3 text-xs text-zinc-500 dark:text-zinc-400'>
          {t(`${k}.uncovered`, { count: semantic.uncovered.length })}
        </p>
      )}
    </ChartCard>
  );
}
