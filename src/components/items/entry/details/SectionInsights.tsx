import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiExternalLink } from 'react-icons/fi';
import { useEntriesById, useSectionPrerequisites, useSectionRelated } from '../../../../hooks/api/graph/useGraph';
import useOpenPublication, { readablePdfIndex } from '../../../../hooks/useOpenPublication';
import { IGraphSection } from '../../../../utils/interfaces/graph';
import { IEntry } from '../../../../utils/interfaces/entry';

const MAX_ITEMS = 5;

const SectionRow = ({
  section,
  entry,
  currentEntryId,
  note,
}: {
  section: IGraphSection;
  entry: IEntry | undefined;
  currentEntryId: string;
  note?: string;
}) => {
  const { t } = useTranslation();
  const { openAt } = useOpenPublication();
  const sameBook = section.entry_id === currentEntryId;
  const readable = readablePdfIndex(entry) >= 0 && !!section.first_page;
  const heading = section.title || t('entry.detail.chapters.untitled', { page: section.first_page ?? '?' });

  return (
    <li className="flex items-start gap-2 py-1">
      <FiBookOpen size={13} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-100">{heading}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {sameBook ? t('entry.detail.insights.thisBook') : entry?.title ?? t('entry.detail.insights.otherBook')}
          {section.first_page ? ` · ${t('entry.detail.insights.page', { page: section.first_page })}` : ''}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={() => openAt(section.entry_id, entry, section.first_page)}
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline dark:text-primaryLight"
      >
        {readable ? t('entry.detail.insights.openAtPage') : t('entry.detail.insights.openBook')}
        <FiExternalLink size={11} aria-hidden />
      </button>
    </li>
  );
};

/**
 * What to read before a section ("Read this first", feature 4) and where other publications explain
 * the same thing ("Explained differently elsewhere", feature 3). Each list hides itself when empty —
 * an empty answer means the graph has no concepts or similarity for this section yet.
 */
export default function SectionInsights({ sectionKey, entryId }: { sectionKey: string; entryId: string }) {
  const { t } = useTranslation();
  const prerequisites = useSectionPrerequisites(sectionKey);
  const related = useSectionRelated(sectionKey);

  const first = (prerequisites.data ?? []).slice(0, MAX_ITEMS);
  // Other books only: this book's own sections are the chapter map's job.
  const elsewhere = (related.data ?? []).filter((s) => s.entry_id !== entryId).slice(0, MAX_ITEMS);
  const entries = useEntriesById([...first, ...elsewhere].map((s) => s.entry_id));

  if (prerequisites.isLoading || related.isLoading) {
    return <p className="text-xs text-gray-400">{t('entry.detail.insights.loading')}</p>;
  }
  if (!first.length && !elsewhere.length) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">{t('entry.detail.insights.none')}</p>;
  }

  const entryOf = (id: string) => entries.data?.get(id);

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
      {first.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('entry.detail.insights.readFirst')}</h4>
          <ul>
            {first.map((s) => (
              <SectionRow
                key={s.key}
                section={s}
                entry={entryOf(s.entry_id)}
                currentEntryId={entryId}
                note={s.later ? t('entry.detail.insights.definedLater') : undefined}
              />
            ))}
          </ul>
        </section>
      )}
      {elsewhere.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{t('entry.detail.insights.elsewhere')}</h4>
          <ul>
            {elsewhere.map((s) => (
              <SectionRow
                key={s.key}
                section={s}
                entry={entryOf(s.entry_id)}
                currentEntryId={entryId}
                note={s.via.includes('concepts') ? t('entry.detail.insights.viaConcepts') : t('entry.detail.insights.viaSimilar')}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
