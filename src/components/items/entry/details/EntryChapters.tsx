import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';
import { FiChevronDown, FiChevronRight, FiCornerUpLeft, FiCornerDownRight } from 'react-icons/fi';
import { CircleLoader } from 'react-spinners';
import { IEntryDetail } from '../../../../utils/interfaces/entry';
import { IChapter, IChapterMap } from '../../../../utils/interfaces/graph';
import { useEntryChapters } from '../../../../hooks/api/graph/useGraph';
import useOpenPublication, { readablePdfIndex } from '../../../../hooks/useOpenPublication';
import SectionInsights from './SectionInsights';

const TOP_LINKS = 3;

type Neighbour = { chapter: IChapter; links: number };

/** Per chapter: the earlier chapters it builds on and the later ones where its material returns. */
const relate = (map: IChapterMap, chapters: IChapter[]) => {
  const byKey = new Map(chapters.map((c) => [c.key, c]));
  const result = new Map<string, { earlier: Neighbour[]; later: Neighbour[] }>(chapters.map((c) => [c.key, { earlier: [], later: [] }]));
  for (const link of map.links) {
    const a = byKey.get(link.source);
    const b = byKey.get(link.target);
    if (!a || !b || a.key === b.key) continue;
    const [first, second] = a.seq < b.seq ? [a, b] : [b, a];
    result.get(second.key)!.earlier.push({ chapter: first, links: link.links });
    result.get(first.key)!.later.push({ chapter: second, links: link.links });
  }
  const strongest = (list: Neighbour[]) => list.sort((x, y) => y.links - x.links).slice(0, TOP_LINKS);
  result.forEach((value) => {
    value.earlier = strongest(value.earlier);
    value.later = strongest(value.later);
  });
  return result;
};

const chapterLabel = (t: (k: string, o?: Record<string, unknown>) => string, chapter: Pick<IChapter, 'title' | 'first_page'>) =>
  chapter.title || t('entry.detail.chapters.untitled', { page: chapter.first_page });

/**
 * "Chapters" of a publication (elvira-portal#41, feature 2): its sections in reading order with the
 * chapters each builds on and where its material returns, from the library graph. A chapter opens
 * the reader at its page; expanding it shows what to read first and where other books explain it.
 * Renders nothing while the graph has no data for this publication.
 */
export default function EntryChapters({ entry }: { entry: IEntryDetail }) {
  const { t } = useTranslation();
  const { data, isLoading } = useEntryChapters(entry.id);
  const { openAt } = useOpenPublication();
  const [open, setOpen] = useState<string | null>(null);

  // Front and back matter (contents, index, references …) relate to everything; leave them out.
  const chapters = useMemo(() => {
    const all = data?.sections ?? [];
    const topical = all.filter((s) => s.topical);
    return topical.length ? topical : all;
  }, [data]);
  const related = useMemo(() => (data ? relate(data, chapters) : new Map()), [data, chapters]);
  // Number the chapters shown (1, 2, …), not the backend `seq`, which also counts skipped front matter.
  const ordinal = useMemo(() => new Map(chapters.map((c, i) => [c.key, i + 1])), [chapters]);

  const canOpen = readablePdfIndex(entry) >= 0;
  const openPage = (page: number) => openAt(entry.id, entry, page);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <CircleLoader size={28} color="#0077cc" />
      </div>
    );
  }
  if (!chapters.length) return <p className="py-4 text-sm text-gray-500 dark:text-gray-400">{t('entry.detail.chapters.empty')}</p>;

  const chip = (n: Neighbour, icon: React.ReactNode) => (
    <button
      key={n.chapter.key}
      type="button"
      disabled={!canOpen}
      onClick={() => openPage(n.chapter.first_page)}
      title={t('entry.detail.chapters.linkStrength', { count: n.links })}
      className="inline-flex max-w-[16rem] items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-700 enabled:hover:border-primary enabled:hover:text-primary dark:border-gray-600 dark:text-gray-300"
    >
      {icon}
      <span className="tabular-nums text-gray-400">{ordinal.get(n.chapter.key)}.</span>
      <span className="truncate">{chapterLabel(t, n.chapter)}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{t('entry.detail.chapters.intro')}</p>
      <ol className="flex flex-col">
        {chapters.map((chapter) => {
          const rel = related.get(chapter.key) ?? { earlier: [], later: [] };
          const expanded = open === chapter.key;
          return (
            <li key={chapter.key} className="border-b border-gray-200 py-2 dark:border-gray-700">
              <div className="flex items-baseline gap-2">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-label={t(expanded ? 'entry.detail.chapters.collapse' : 'entry.detail.chapters.expand')}
                  onClick={() => setOpen(expanded ? null : chapter.key)}
                  className="self-center text-gray-400 hover:text-primary"
                >
                  {expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                <button
                  type="button"
                  disabled={!canOpen}
                  onClick={() => openPage(chapter.first_page)}
                  className={twMerge('min-w-0 flex-1 text-left font-medium text-black dark:text-white', canOpen && 'hover:text-primary dark:hover:text-primaryLight')}
                >
                  <span className="mr-2 font-semibold tabular-nums text-primary dark:text-primaryLight">{ordinal.get(chapter.key)}.</span>
                  {chapterLabel(t, chapter)}
                </button>
                <span className="shrink-0 text-xs tabular-nums text-gray-400">
                  {chapter.first_page === chapter.last_page ? chapter.first_page : `${chapter.first_page}–${chapter.last_page}`}
                </span>
              </div>

              {(rel.earlier.length > 0 || rel.later.length > 0) && (
                <div className="mt-1.5 flex flex-col gap-1 pl-6 text-xs">
                  {rel.earlier.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-gray-500 dark:text-gray-400">{t('entry.detail.chapters.buildsOn')}</span>
                      {rel.earlier.map((n: Neighbour) => chip(n, <FiCornerUpLeft size={11} aria-hidden />))}
                    </div>
                  )}
                  {rel.later.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-gray-500 dark:text-gray-400">{t('entry.detail.chapters.returnsIn')}</span>
                      {rel.later.map((n: Neighbour) => chip(n, <FiCornerDownRight size={11} aria-hidden />))}
                    </div>
                  )}
                </div>
              )}

              {expanded && (
                <div className="mt-2 pl-6">
                  <SectionInsights sectionKey={chapter.key} entryId={entry.id} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
