import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiBookmark, FiClock, FiX } from 'react-icons/fi';
import useEscapeLayer from '../../../hooks/useEscapeLayer';
import { ExploreGraph, ExploreNode, PersonalMark } from '../../../utils/func/exploreGraph';
import { IEntry } from '../../../utils/interfaces/entry';
import { fmtDate } from '../../../utils/func/adminDate';
import Thumbnail from '../../items/entry/Thumbnail';

/** A cover to start the walk from. */
const StartCard = ({ node, entry, date, onPick }: { node: ExploreNode; entry: IEntry | undefined; date: string | null; onPick: () => void }) => (
  <button type="button" onClick={onPick} className="group flex w-24 shrink-0 flex-col gap-1 text-left">
    <Thumbnail thumbnail={entry?.thumbnail} alt="" wrapperClassName="h-32 w-24 rounded-lg shadow-md ring-1 ring-black/10 transition-transform group-hover:-translate-y-0.5" />
    <span className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-800 group-hover:text-primary dark:text-zinc-100 dark:group-hover:text-primaryLight">{node.title}</span>
    {date && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{date}</span>}
  </button>
);

/**
 * "What is this?": what the map shows, in numbers, what it is good and not good for, how to move
 * around it, and the reader's own publications as places to start again.
 */
export default function ExploreAbout({
  open,
  onClose,
  graph,
  marks,
  entries,
  onFocus,
}: {
  open: boolean;
  onClose: () => void;
  graph: ExploreGraph;
  marks: Map<string, PersonalMark>;
  entries: Map<string, IEntry>;
  onFocus: (id: string) => void;
}) {
  const { t } = useTranslation();
  useEscapeLayer(onClose, open);
  if (!open) return null;

  const count = (kind: ExploreNode['kind']) => graph.nodes.filter((n) => n.kind === kind).length;
  const onMap = [...marks].filter(([id]) => graph.byId.has(id)).map(([id, mark]) => ({ node: graph.byId.get(id)!, mark }));
  const read = onMap.filter((m) => m.mark.readAt).sort((a, b) => b.mark.readAt!.localeCompare(a.mark.readAt!));
  const shelf = onMap.filter((m) => m.mark.shelfAt).sort((a, b) => b.mark.shelfAt!.localeCompare(a.mark.shelfAt!));
  const stats = [
    { label: t('explore.about.stats.publications'), value: count('entry') },
    { label: t('explore.about.stats.topics'), value: count('topic') },
    { label: t('explore.about.stats.links'), value: graph.edges.filter((e) => e.kind === 'similar').length },
    { label: t('explore.about.stats.roads'), value: graph.roads.length },
    { label: t('explore.about.stats.read'), value: read.length },
    { label: t('explore.about.stats.shelf'), value: shelf.length },
  ];
  const pick = (id: string) => {
    onClose();
    onFocus(id);
  };
  const list = (key: string) => (t(`explore.about.${key}`, { returnObjects: true }) as string[]).map((line) => <li key={line}>{line}</li>);
  const h3 = 'text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('explore.about.title')}
        className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t('explore.about.title')}</h2>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <FiX />
          </button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{t('explore.panel.intro', { count: count('entry') })}</p>

          <dl className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{s.value}</dd>
                <dt className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">{s.label}</dt>
              </div>
            ))}
          </dl>

          {[
            { icon: <FiClock />, title: t('explore.panel.read'), items: read.map((m) => ({ ...m, date: fmtDate(m.mark.readAt) })) },
            { icon: <FiBookmark />, title: t('explore.panel.shelf'), items: shelf.map((m) => ({ ...m, date: fmtDate(m.mark.shelfAt) })) },
          ]
            .filter((group) => group.items.length)
            .map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <h3 className={`flex items-center gap-1.5 ${h3}`}>
                  {group.icon} {t('explore.about.startFrom', { list: group.title })}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {group.items.slice(0, 8).map(({ node, date }) => (
                    <StartCard key={node.id} node={node} entry={entries.get(node.id)} date={date} onPick={() => pick(node.id)} />
                  ))}
                </div>
              </div>
            ))}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <h3 className={h3}>{t('explore.about.goodFor')}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-zinc-700 dark:text-zinc-200">{list('pros')}</ul>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className={h3}>{t('explore.about.limits')}</h3>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-zinc-700 dark:text-zinc-200">
                <li>{t('explore.map.note')}</li>
                {list('cons')}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className={h3}>{t('explore.about.reading')}</h3>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-zinc-700 dark:text-zinc-200">{list('legend')}</ul>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('explore.canvas.hint')}</p>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
