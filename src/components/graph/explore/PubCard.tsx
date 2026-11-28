import { useTranslation } from 'react-i18next';
import { FiBookmark, FiCheck } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { ExploreNode, PersonalMark } from '../../../utils/func/exploreGraph';
import { IEntry } from '../../../utils/interfaces/entry';
import { fmtDate } from '../../../utils/func/adminDate';
import Thumbnail from '../../items/entry/Thumbnail';

export const authorsOf = (entry: IEntry | undefined) =>
  entry?.authors
    ?.map((a) => `${a.name ?? ''} ${a.surname ?? ''}`.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ') ?? '';

export const yearOf = (entry: IEntry | undefined) => (entry?.published_at ? new Date(entry.published_at).getFullYear() : null);

/** Read / on the shelf, with the date: the reader's own story with a publication. */
export function PersonalStatus({ mark, className }: { mark: PersonalMark | undefined; className?: string }) {
  const { t } = useTranslation();
  if (!mark?.readAt && !mark?.shelfAt) return null;
  return (
    <span className={twMerge('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium', className)}>
      {mark.readAt && (
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <FiCheck className="shrink-0" />
          {t('explore.personal.read', { date: fmtDate(mark.readAt) })}
          {(mark.reads ?? 0) > 1 ? ` · ${mark.reads}×` : ''}
        </span>
      )}
      {mark.shelfAt && (
        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
          <FiBookmark className="shrink-0" />
          {mark.readAt ? t('explore.personal.shelfShort') : t('explore.personal.shelf', { date: fmtDate(mark.shelfAt) })}
        </span>
      )}
    </span>
  );
}

/**
 * A publication as a packed card: cover, title, author and year, the reader's status, and how
 * close it is (when it stands in a list of neighbours). Clicking walks the map to it.
 */
export default function PubCard({
  node,
  entry,
  mark,
  score,
  note,
  onFocus,
  onHighlight,
}: {
  node: ExploreNode;
  entry: IEntry | undefined;
  mark?: PersonalMark;
  /** Content closeness 0–1. */
  score?: number;
  /** One line under the title: why it is listed here. */
  note?: string;
  onFocus: (id: string) => void;
  onHighlight?: (id: string | null) => void;
}) {
  const meta = [authorsOf(entry), yearOf(entry)].filter(Boolean).join(' · ');
  return (
    <li>
      <button
        type="button"
        onClick={() => onFocus(node.id)}
        onMouseEnter={() => onHighlight?.(node.id)}
        onMouseLeave={() => onHighlight?.(null)}
        onFocus={() => onHighlight?.(node.id)}
        onBlur={() => onHighlight?.(null)}
        className="group flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Thumbnail thumbnail={entry?.thumbnail} alt="" wrapperClassName="h-14 w-10 shrink-0 rounded shadow-sm ring-1 ring-black/10" />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-800 group-hover:text-primary dark:text-zinc-100 dark:group-hover:text-primaryLight">
            {node.title}
          </span>
          {meta && <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">{meta}</span>}
          {note && <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">{note}</span>}
          <PersonalStatus mark={mark} />
        </span>
        {score !== undefined && (
          <span
            className="mt-0.5 shrink-0 rounded-full border border-zinc-200 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            title={String(score)}
          >
            {Math.round(score * 100)}
          </span>
        )}
      </button>
    </li>
  );
}
