import { ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown } from 'react-icons/fi';
import { ACTION_KINDS, ActionKind, TitleAction } from './semantic';

/**
 * "Subjects & substitutes" folded into one line: the counts of what it would tell you to do, so a
 * librarian knows whether it is worth opening. The detail (action board, subject balance,
 * neighbourhood maps) renders only when opened — and prints only when open.
 */
export default function SemanticsDisclosure({
  id,
  open,
  onToggle,
  actions,
  guide,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  actions: Record<ActionKind, TitleAction[]>;
  guide: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const k = 'administration.dashboard.semanticsFold';
  const panelId = useId();
  const counts = ACTION_KINDS.filter((kind) => actions[kind].length > 0);

  return (
    <section
      id={id}
      data-guide={guide}
      className={`scroll-mt-20 ${open ? '' : 'print:hidden'}`}
    >
      <button
        type='button'
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(!open)}
        className='flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary dark:border-zinc-700 dark:bg-zinc-800'
      >
        <span className='min-w-0 flex-1'>
          <span className='block text-base font-bold text-secondary dark:text-secondaryLight'>
            {t('administration.dashboard.sections.semantics')}
          </span>
          <span className='block text-sm text-zinc-500 dark:text-zinc-400'>
            {counts.length
              ? counts
                  .map((kind) =>
                    t(`${k}.${kind}`, { count: actions[kind].length })
                  )
                  .join(' · ')
              : t(`${k}.nothing`)}
          </span>
        </span>
        <span className='hidden text-xs text-zinc-400 sm:inline'>
          {open ? t(`${k}.hide`) : t(`${k}.show`)}
        </span>
        <FiChevronDown
          size={18}
          aria-hidden
          className={`shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id={panelId} className='mt-3 space-y-4'>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            {t('administration.dashboard.sections.semanticsSub')}
          </p>
          {children}
        </div>
      )}
    </section>
  );
}
