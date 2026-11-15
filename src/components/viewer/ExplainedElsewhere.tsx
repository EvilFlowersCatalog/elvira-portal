import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useEntriesById, useEntryChapters, useSectionRelated } from '../../hooks/api/graph/useGraph';
import useOpenPublication from '../../hooks/useOpenPublication';
import useAppContext from '../../hooks/contexts/useAppContext';
import { IChapter, IRelatedSection } from '../../utils/interfaces/graph';
import { IEntry } from '../../utils/interfaces/entry';

const MAX_ITEMS = 3;
const COLLAPSED_KEY = 'elvira.reader.elsewhere.collapsed';

/** The outline entry holding `page`: of the topical sections that span it, the one starting last (the innermost). */
const sectionAt =(sections: IChapter[], page: number): IChapter | null =>
  sections
    .filter((s) => s.topical && s.first_page <= page && page <= s.last_page)
    .reduce<IChapter | null>(
      (best, s) => (!best || s.first_page > best.first_page || (s.first_page === best.first_page && s.seq > best.seq) ? s : best),
      null,
    );

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

const languageOf = (entry: IEntry | undefined) =>
  (entry?.language?.alpha2 ?? entry?.language_code)?.toLowerCase() || null;

/**
 * "Explained elsewhere" in the reader (elvira-portal#43): for the section on screen, up to three sections of
 * *other* publications that cover the same ground, in any language (`GET /api/v1/sections/{key}/related`). Each
 * opens the reader at its page. Renders nothing while loading, for a page outside any topical section, and for a
 * section without links — never an empty box.
 */
export default function ExplainedElsewhere({ entryId, page }: { entryId: string; page: number | null }) {
  const { t } = useTranslation();
  const { umamiTrack } = useAppContext();
  const { openAt } = useOpenPublication();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const chapters = useEntryChapters(entryId);
  const section = useMemo(
    () => (page && chapters.data ? sectionAt(chapters.data.sections, page) : null),
    [chapters.data, page],
  );
  const related = useSectionRelated(section?.key ?? null);
  const items: IRelatedSection[] = (related.data ?? []).filter((s) => s.entry_id !== entryId).slice(0, MAX_ITEMS);
  // The book open here too, for its language.
  const entries = useEntriesById(items.length ? [entryId, ...items.map((s) => s.entry_id)] : []);

  if (!section || !items.length) return null;

  const ownLanguage = languageOf(entries.data?.get(entryId));
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // A private window keeps the choice for this page only.
    }
  };

  const open = (target: IRelatedSection, entry: IEntry | undefined) => {
    umamiTrack('Reader Explained Elsewhere', {
      from_entry: entryId,
      from_section: section.key,
      to_entry: target.entry_id,
      to_section: target.key,
      language: languageOf(entry) ?? '',
    });
    openAt(target.entry_id, entry, target.first_page);
  };

  return (
    <aside
      aria-label={t('reader.elsewhere.title')}
      className="fixed bottom-16 left-3 z-40 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-zinc-200 bg-white/95 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <FiBookOpen size={14} className="shrink-0 text-primary dark:text-primaryLight" aria-hidden />
        <span className="flex-1 text-xs font-semibold text-gray-800 dark:text-gray-100">
          {t('reader.elsewhere.title')}
          <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">({items.length})</span>
        </span>
        {collapsed ? <FiChevronUp size={14} aria-hidden /> : <FiChevronDown size={14} aria-hidden />}
      </button>
      {!collapsed && (
        <ul className="flex flex-col gap-0.5 border-t border-zinc-200 px-1.5 pb-1.5 pt-1 dark:border-zinc-700">
          {items.map((item) => {
            const entry = entries.data?.get(item.entry_id);
            const language = languageOf(entry);
            const heading = item.title || t('entry.detail.chapters.untitled', { page: item.first_page ?? '?' });
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => open(item, entry)}
                  className="flex w-full flex-col gap-0.5 rounded-md px-1.5 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="line-clamp-2 text-sm text-gray-900 dark:text-gray-100">{heading}</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {language && language !== ownLanguage ? (
                      <span className="rounded border border-zinc-300 px-1 font-semibold uppercase tracking-wide text-gray-700 dark:border-zinc-600 dark:text-gray-200">
                        {language}
                      </span>
                    ) : null}
                    <span className="truncate">{entry?.title ?? t('entry.detail.insights.otherBook')}</span>
                    {item.first_page ? (
                      <span className="shrink-0">· {t('entry.detail.insights.page', { page: item.first_page })}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
