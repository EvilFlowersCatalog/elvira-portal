import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiChevronDown, FiChevronRight, FiLink, FiNavigation, FiSave, FiTrash2, FiX } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { ExploreGraph, ExploreNode } from '../../../../utils/func/exploreGraph';
import { fmtDate } from '../../../../utils/func/adminDate';
import { Swatch } from '../../LibraryMap';
import { ExploreTrailState } from './useExploreTrail';

const short = (text: string, max = 22) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

const iconButton =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white';

/**
 * FEATURE: reading trail. A strip across the top of the map: the steps of the walk (click to
 * jump back), save, copy a link, and the trails saved earlier in this browser.
 */
export default function ExploreTrail({
  state,
  graph,
  labelOf,
  focusId,
  onFocus,
}: {
  state: ExploreTrailState;
  graph: ExploreGraph;
  labelOf: (n: ExploreNode) => string;
  focusId: string | null;
  onFocus: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [listOpen, setListOpen] = useState(false);
  const [done, setDone] = useState<'saved' | 'copied' | null>(null);
  const steps = state.trail.map((id) => graph.byId.get(id)).filter((n): n is ExploreNode => !!n);
  if (steps.length < 2 && !state.saved.length) return null;

  const flash = (what: 'saved' | 'copied') => {
    setDone(what);
    window.setTimeout(() => setDone(null), 1600);
  };
  const save = () => {
    state.save(`${short(labelOf(steps[0]), 28)} → ${short(labelOf(steps[steps.length - 1]), 28)}`);
    flash('saved');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.shareUrl());
      flash('copied');
    } catch {
      // No clipboard access: nothing to tell beyond the button not confirming.
    }
  };

  return (
    <div className="pointer-events-auto relative flex max-w-full flex-col items-start">
      <div className="flex h-10 max-w-full items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <span className="flex shrink-0 items-center gap-1.5 pl-2 pr-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400" title={t('explore.trail.title')}>
          <FiNavigation /> {steps.length >= 2 ? steps.length : t('explore.trail.title')}
        </span>

        {steps.length >= 2 && (
          <>
            <ol className="flex min-w-0 items-center overflow-x-auto [scrollbar-width:none]">
              {steps.map((n, i) => (
                <li key={`${n.id}-${i}`} className="flex shrink-0 items-center">
                  {i > 0 && <FiChevronRight className="shrink-0 text-zinc-300 dark:text-zinc-600" />}
                  <button
                    type="button"
                    onClick={() => onFocus(n.id)}
                    title={labelOf(n)}
                    className={twMerge(
                      'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      n.id === focusId ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'
                    )}
                  >
                    <Swatch cls={n.cls} />
                    {short(labelOf(n))}
                  </button>
                </li>
              ))}
            </ol>
            <span aria-hidden className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
            <button type="button" onClick={save} className={iconButton} title={t('explore.trail.save')}>
              {done === 'saved' ? <FiCheck /> : <FiSave />} {t(done === 'saved' ? 'explore.trail.saved' : 'explore.trail.save')}
            </button>
            <button type="button" onClick={copy} className={iconButton} title={t('explore.trail.copy')}>
              {done === 'copied' ? <FiCheck /> : <FiLink />} {t(done === 'copied' ? 'explore.trail.copied' : 'explore.trail.copy')}
            </button>
            <button type="button" onClick={state.clear} className={twMerge(iconButton, 'w-8 justify-center px-0')} title={t('explore.trail.clear')} aria-label={t('explore.trail.clear')}>
              <FiX />
            </button>
          </>
        )}

        {state.saved.length > 0 && (
          <button type="button" aria-expanded={listOpen} onClick={() => setListOpen((v) => !v)} className={iconButton}>
            {t('explore.trail.savedList', { count: state.saved.length })} <FiChevronDown className={twMerge('transition-transform', listOpen && 'rotate-180')} />
          </button>
        )}
      </div>

      {listOpen && state.saved.length > 0 && (
        <ul className="mt-1 flex w-80 max-w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-1 shadow-xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
          {state.saved.map((s) => (
            <li key={s.id} className="flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={() => {
                  state.load(s.ids);
                  setListOpen(false);
                  const last = [...s.ids].reverse().find((id) => graph.byId.has(id));
                  if (last) onFocus(last);
                }}
                className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="block truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">{s.name}</span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t('explore.trail.steps', { count: s.ids.length })} · {fmtDate(s.savedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => state.remove(s.id)}
                aria-label={t('explore.trail.remove')}
                title={t('explore.trail.remove')}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
