import { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaX } from 'react-icons/fa6';
import { FiCompass, FiSearch, FiSettings, FiSliders } from 'react-icons/fi';
import useGuide from '../../hooks/contexts/useGuide';
import useEscapeLayer from '../../hooks/useEscapeLayer';
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
 * The "find your way" dialog, opened from the sidebar: replayable tours and the places people most often look
 * for. These start the guide straight away — no model call is involved.
 */
export default function GuideExplore({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { start, access } = useGuide();
  useEscapeLayer(onClose, open);

  if (!open) return null;

  const tours = TOURS.filter((tour) => guideTour(tour.id, access));
  const places = PLACES.filter((id) => guideTarget(id, access)).slice(0, 6);

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('guide.explore.title')}
        className="relative flex w-full max-w-xl flex-col gap-3 rounded-xl bg-white p-5 shadow-2xl dark:bg-zinc-800"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black dark:text-white">{t('guide.explore.title')}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <FaX size={14} className="text-black dark:text-white" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tours.map(({ id, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onClose();
                start({ targets: [], tour: id });
              }}
              className="group flex items-start gap-3 rounded-lg border border-zinc-300 p-2.5 text-left transition-colors hover:border-primary dark:border-zinc-600 dark:hover:border-primaryLight"
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
                onClick={() => {
                  onClose();
                  start({ targets: [id] });
                }}
                className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-gray-700 transition-colors hover:border-primary hover:text-primary dark:border-zinc-600 dark:text-gray-200 dark:hover:border-primaryLight dark:hover:text-primaryLight"
              >
                {targetTitle(id, t)}
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}
