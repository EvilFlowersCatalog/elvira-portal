import { useTranslation } from 'react-i18next';
import { FiArrowUpRight, FiCompass, FiPlay } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import useGuide from '../../hooks/contexts/useGuide';
import type { IAssistantGuide } from '../../utils/interfaces/assistant';
import { guideTarget, guideTour, targetTitle, targetTrail } from './guideRegistry';

/**
 * The assistant's offer to show the way, under its answer: one row per place ("Show me" lights it up, the arrow
 * just goes there) or a tour to start. Built from registry ids only; anything this reader may not open is gone.
 */
export default function GuideCard({ guide }: { guide: IAssistantGuide }) {
  const { t } = useTranslation();
  const { start, go, access } = useGuide();

  const tour = guide.tour ? guideTour(guide.tour, access) : undefined;
  const targets = guide.targets.filter((id) => guideTarget(id, access));
  if (!tour && !targets.length) return null;

  const stops = tour ? tour.targets.filter((id) => guideTarget(id, access)).length : 0;

  return (
    <section
      aria-label={t('guide.card.title')}
      className="overflow-hidden rounded-xl border border-zinc-200 border-l-[3px] border-l-primary bg-white shadow-sm dark:border-zinc-600 dark:border-l-primary dark:bg-zinc-800 animate-fade-in"
    >
      <header className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-700">
        <FiCompass size={14} className="text-primary" aria-hidden="true" />
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{t('guide.card.title')}</span>
      </header>

      {tour ? (
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t(`guide.tours.${tour.id}.title`)}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t(`guide.tours.${tour.id}.body`)} · {t('guide.card.stops', { count: stops })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => start({ targets: [], tour: tour.id }, { fromChat: true })}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primaryDark"
          >
            <FiPlay size={13} aria-hidden="true" />
            {t('guide.card.startTour')}
          </button>
        </div>
      ) : null}

      {targets.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
          {targets.map((id) => (
            <li key={id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{targetTitle(id, t)}</p>
                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{targetTrail(id, t).join(' › ')}</p>
              </div>
              <button
                type="button"
                onClick={() => start({ targets: [id] }, { fromChat: true })}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primaryDark"
              >
                <HiSparkles size={12} aria-hidden="true" />
                {t('guide.card.showMe')}
              </button>
              {guideTarget(id, access)?.path ? (
                <button
                  type="button"
                  onClick={() => go({ targets: [id] })}
                  aria-label={t('guide.card.goThere', { label: targetTitle(id, t) })}
                  title={t('guide.card.goThereHint')}
                  className="inline-flex shrink-0 items-center rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
                >
                  <FiArrowUpRight size={15} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
