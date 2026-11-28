import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import { ExploreGraph, PersonalMark } from '../../../../utils/func/exploreGraph';
import { useLocalize } from '../../../../utils/func/localized';
import PubCard from '../PubCard';
import { ExploreCollectionState } from './useExploreCollection';

const PAGE = 8;

/**
 * FEATURE: collection view. The panel tab: the collections that have publications on the map,
 * and for the chosen one its publications and what surrounds them.
 */
export default function ExploreCollections({
  state,
  graph,
  marks,
  onFocus,
  onHighlight,
}: {
  state: ExploreCollectionState;
  graph: ExploreGraph;
  marks: Map<string, PersonalMark>;
  onFocus: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const [shown, setShown] = useState(PAGE);
  const heading = 'flex items-baseline gap-1.5 px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

  if (state.loading) return <p className="px-2 py-2 text-sm text-zinc-500 dark:text-zinc-400">{t('explore.collections.loading')}</p>;

  if (!state.selected || !state.view) {
    return (
      <>
        <p className={heading}>{t('explore.collections.title')}</p>
        {state.collections.length ? (
          <ul className="flex flex-col">
            {state.collections.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setShown(PAGE);
                    state.select(c.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 hover:text-primary dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-primaryLight"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold">{localize(c.title)}</span>
                  <span className="text-xs tabular-nums text-zinc-400">{c.ids.length}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 pb-2 text-sm text-zinc-500 dark:text-zinc-400">{t('explore.collections.empty')}</p>
        )}
      </>
    );
  }

  const { selected, view, entries } = state;
  return (
    <>
      <button
        type="button"
        onClick={() => state.select(null)}
        className="mb-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <FiArrowLeft /> {t('explore.collections.all')}
      </button>
      <h2 className="px-2 text-base font-bold leading-snug text-zinc-900 dark:text-zinc-50">{localize(selected.title)}</h2>
      <p className="px-2 pb-2 text-xs text-zinc-500 dark:text-zinc-400">{t('explore.collections.lit')}</p>

      <p className={heading}>
        {t('explore.collections.inside')} <span className="font-normal tabular-nums text-zinc-400">{selected.ids.length}</span>
      </p>
      <ul className="flex flex-col">
        {selected.ids.slice(0, shown).map((id) => (
          <PubCard key={id} node={graph.byId.get(id)!} entry={entries?.get(id)} mark={marks.get(id)} onFocus={onFocus} onHighlight={onHighlight} />
        ))}
      </ul>
      {selected.ids.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + 12)} className="px-2 py-1 text-xs font-semibold text-primary hover:underline dark:text-primaryLight">
          {t('explore.focus.showMore', { count: selected.ids.length - shown })}
        </button>
      )}

      {view.around.length > 0 && (
        <>
          <p className={`mt-2 border-t border-zinc-100 pt-3 dark:border-zinc-800 ${heading}`}>{t('explore.collections.around')}</p>
          <ul className="flex flex-col">
            {view.around.slice(0, 6).map(({ id, via, best }) => (
              <PubCard
                key={id}
                node={graph.byId.get(id)!}
                entry={entries?.get(id)}
                mark={marks.get(id)}
                score={best}
                note={t('explore.panel.nextVia', { title: graph.byId.get(via)?.title ?? '' })}
                onFocus={onFocus}
                onHighlight={onHighlight}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
