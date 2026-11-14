import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCompass, FiSearch, FiSettings, FiSliders } from 'react-icons/fi';
import useGuide from '../../hooks/contexts/useGuide';
import { guideTarget, guideTour, targetTitle } from './guideRegistry';

const TOURS: { id: string; icon: ReactElement }[] = [
  { id: 'portal', icon: <FiCompass size={16} /> },
  { id: 'find-book', icon: <FiSearch size={16} /> },
  { id: 'account', icon: <FiSettings size={16} /> },
  { id: 'admin', icon: <FiSliders size={16} /> },
];

/** Quick "where is …" places, readers' first; the administration's for administrators. */
const PLACES = ['loans', 'shelf', 'history', 'passphrase', 'categories', 'admin-add-entry', 'admin-users', 'admin-jobs'];

/**
 * The empty chat's "find your way" panel: replayable tours and the places people most often look for. These start
 * the guide straight away — no model call, so they work even when the assistant is busy or unavailable.
 */
export default function GuideExplore({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { start, access } = useGuide();

  const tours = TOURS.filter((tour) => guideTour(tour.id, access));
  const places = PLACES.filter((id) => guideTarget(id, access)).slice(0, 6);
  if (!tours.length) return null;

  return (
    <section aria-label={t('guide.explore.title')} className={`w-full flex flex-col gap-2 ${compact ? '' : 'max-w-2xl'}`}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{t('guide.explore.title')}</span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tours.map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => start({ targets: [], tour: id }, { fromChat: true })}
            className="group flex items-start gap-3 rounded-lg border border-zinc-300 bg-white/60 p-2.5 text-left transition-colors hover:border-primary hover:bg-white dark:border-zinc-600 dark:bg-zinc-800/60 dark:hover:border-primaryLight dark:hover:bg-zinc-800"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primaryLight text-primaryText transition-transform group-hover:scale-105 dark:bg-primaryDark dark:text-primaryLight">
              {icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-black dark:text-white">{t(`guide.tours.${id}.title`)}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{t(`guide.tours.${id}.body`)}</span>
            </span>
          </button>
        ))}
      </div>
      {places.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('guide.explore.whereIs')}</span>
          {places.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => start({ targets: [id] }, { fromChat: true })}
              className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-gray-700 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-gray-200 dark:hover:border-primaryLight dark:hover:text-primaryLight"
            >
              {targetTitle(id, t)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
