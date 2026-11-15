import { ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiBookOpen, FiExternalLink, FiX } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';
import { ExploreGraph, ExploreNode } from '../../../utils/func/exploreGraph';
import { useEntriesById } from '../../../hooks/api/graph/useGraph';
import useOpenPublication, { readablePdfIndex } from '../../../hooks/useOpenPublication';
import Thumbnail from '../../items/entry/Thumbnail';
import { Swatch } from '../LibraryMap';

const plainText = (html: string | undefined) => {
  if (!html) return '';
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';
};

const Section = ({ title, children, count }: { title: string; children: ReactNode; count?: number }) => (
  <section className="flex flex-col gap-1.5">
    <h3 className="flex items-baseline gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {title}
      {count !== undefined && <span className="font-normal tabular-nums text-zinc-400">{count}</span>}
    </h3>
    {children}
  </section>
);

/** A row that walks the map to another node; hovering it lights the node up on the canvas. */
function NodeRow({
  node,
  label,
  meta,
  score,
  onFocus,
  onHighlight,
}: {
  node: ExploreNode;
  label: string;
  meta?: string;
  score?: number;
  onFocus: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onFocus(node.id)}
        onMouseEnter={() => onHighlight(node.id)}
        onMouseLeave={() => onHighlight(null)}
        onFocus={() => onHighlight(node.id)}
        onBlur={() => onHighlight(null)}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <Swatch cls={node.cls} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm text-zinc-800 group-hover:text-primary dark:text-zinc-100 dark:group-hover:text-primaryLight">{label}</span>
          {meta && <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">{meta}</span>}
        </span>
        {score !== undefined && (
          <span className="flex shrink-0 items-center gap-1.5" title={String(score)}>
            <span className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <span className="block h-full rounded-full bg-[var(--viz-ink-2)]" style={{ width: `${Math.round(Math.max(0, Math.min(1, score)) * 100)}%` }} />
            </span>
            <span className="w-6 text-right text-[11px] tabular-nums text-zinc-500">{Math.round(score * 100)}</span>
          </span>
        )}
      </button>
    </li>
  );
}

const Chip = ({ node, label, onFocus }: { node: ExploreNode; label: string; onFocus: (id: string) => void }) => (
  <button
    type="button"
    onClick={() => onFocus(node.id)}
    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
  >
    <Swatch cls={node.cls} />
    <span className="truncate">{label}</span>
  </button>
);

function EntryFocus({
  graph,
  node,
  labelOf,
  onFocus,
  onHighlight,
}: {
  graph: ExploreGraph;
  node: ExploreNode;
  labelOf: (n: ExploreNode) => string;
  onFocus: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const { openDetail, openAt } = useOpenPublication();
  const similar = graph.similar.get(node.id) ?? [];
  const topic = node.topicId ? graph.byId.get(node.topicId) : undefined;
  const domain = graph.byId.get(node.domainId!)!;
  const siblings = (topic?.children ?? []).filter((id) => id !== node.id && !similar.some((s) => s.id === id));

  // One request for everything the panel shows; the previous answer stays up while hopping.
  const { data: entries } = useEntriesById([node.id, ...similar.map((s) => s.id)], { keepPrevious: true });
  const entry = entries?.get(node.id);
  const summary = useMemo(() => plainText(entry?.summary), [entry?.summary]);
  const authors = entry?.authors?.map((a) => `${a.name} ${a.surname}`.trim()).filter(Boolean) ?? [];
  const year = entry?.published_at ? new Date(entry.published_at).getFullYear() : null;
  const readable = readablePdfIndex(entry) >= 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-4">
        <Thumbnail
          key={node.id}
          thumbnail={entry?.thumbnail}
          alt=""
          wrapperClassName="h-32 w-24 shrink-0 rounded-lg shadow-md ring-1 ring-black/5"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-50">{node.title}</h2>
          <p className={twMerge('mt-1 text-sm text-zinc-600 dark:text-zinc-300', !entry && 'animate-pulse')}>
            {entry ? authors.slice(0, 3).join(', ') || t('explore.focus.noAuthor') : ' '}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {[year, node.pages ? t('explore.map.pages', { count: node.pages }) : null].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {topic && <Chip node={topic} label={labelOf(topic)} onFocus={onFocus} />}
        <Chip node={domain} label={labelOf(domain)} onFocus={onFocus} />
      </div>

      {summary && <p className="line-clamp-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{summary}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openDetail(node.id)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primaryDark"
        >
          <FiExternalLink /> {t('explore.focus.details')}
        </button>
        {readable && (
          <button
            type="button"
            onClick={() => openAt(node.id, entry, 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FiBookOpen /> {t('explore.focus.read')}
          </button>
        )}
      </div>

      <Section title={t('explore.focus.similar')} count={similar.length}>
        {similar.length ? (
          <ul className="-mx-2 flex flex-col">
            {similar.map(({ id, score }) => {
              const other = graph.byId.get(id)!;
              const otherTopic = other.topicId ? graph.byId.get(other.topicId) : undefined;
              return (
                <NodeRow
                  key={id}
                  node={other}
                  label={other.title ?? ''}
                  meta={otherTopic && otherTopic.id !== topic?.id ? labelOf(otherTopic) : undefined}
                  score={score}
                  onFocus={onFocus}
                  onHighlight={onHighlight}
                />
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('explore.focus.noSimilar')}</p>
        )}
        {similar.length > 0 && <p className="text-[11px] text-zinc-400">{t('explore.focus.scoreNote')}</p>}
      </Section>

      {topic && siblings.length > 0 && (
        <Section title={t('explore.focus.alsoIn', { topic: labelOf(topic) })} count={siblings.length}>
          <ul className="-mx-2 flex flex-col">
            {siblings.slice(0, 6).map((id) => {
              const other = graph.byId.get(id)!;
              return <NodeRow key={id} node={other} label={other.title ?? ''} onFocus={onFocus} onHighlight={onHighlight} />;
            })}
          </ul>
          {siblings.length > 6 && (
            <button type="button" onClick={() => onFocus(topic.id)} className="self-start text-xs font-semibold text-primary hover:underline dark:text-primaryLight">
              {t('explore.focus.showTopic', { count: topic.children.length })}
            </button>
          )}
        </Section>
      )}
    </div>
  );
}

function TopicFocus({
  graph,
  node,
  labelOf,
  onFocus,
  onHighlight,
}: {
  graph: ExploreGraph;
  node: ExploreNode;
  labelOf: (n: ExploreNode) => string;
  onFocus: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const domain = graph.byId.get(node.domainId!)!;
  const related = graph.relatedTopics.get(node.id) ?? [];
  const members = node.children
    .map((id) => graph.byId.get(id)!)
    .sort((a, b) => (graph.similar.get(b.id)?.length ?? 0) - (graph.similar.get(a.id)?.length ?? 0) || (a.title ?? '').localeCompare(b.title ?? ''));
  const internal = graph.edges.filter((e) => e.kind === 'similar' && node.children.includes(e.source) && node.children.includes(e.target)).length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('explore.focus.topic')}</p>
        <h2 className="mt-0.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">{labelOf(node)}</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {/^\d/.test(node.term ?? '') && <span className="mr-1.5 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">{t('explore.focus.udc', { code: node.term })}</span>}
          {t('explore.focus.publications', { count: node.children.length })}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip node={domain} label={labelOf(domain)} onFocus={onFocus} />
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{t('explore.focus.internalLinks')}</dt>
          <dd className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{internal}</dd>
        </div>
        <div className="rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
          <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{t('explore.focus.bridges')}</dt>
          <dd className="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{related.reduce((sum, r) => sum + r.links, 0)}</dd>
        </div>
      </dl>
      {related.length > 0 && (
        <Section title={t('explore.focus.relatedTopics')} count={related.length}>
          <ul className="-mx-2 flex flex-col">
            {related.slice(0, 6).map(({ id, links }) => {
              const other = graph.byId.get(id)!;
              return (
                <NodeRow
                  key={id}
                  node={other}
                  label={labelOf(other)}
                  meta={t('explore.focus.sharedLinks', { count: links })}
                  onFocus={onFocus}
                  onHighlight={onHighlight}
                />
              );
            })}
          </ul>
        </Section>
      )}
      <Section title={t('explore.focus.members')} count={members.length}>
        <ul className="-mx-2 flex flex-col">
          {members.map((m) => (
            <NodeRow
              key={m.id}
              node={m}
              label={m.title ?? ''}
              meta={t('explore.map.neighbours', { count: graph.similar.get(m.id)?.length ?? 0 })}
              onFocus={onFocus}
              onHighlight={onHighlight}
            />
          ))}
        </ul>
      </Section>
    </div>
  );
}

function DomainFocus({
  graph,
  node,
  labelOf,
  onFocus,
  onHighlight,
}: {
  graph: ExploreGraph;
  node: ExploreNode;
  labelOf: (n: ExploreNode) => string;
  onFocus: (id: string) => void;
  onHighlight: (id: string | null) => void;
}) {
  const { t } = useTranslation();
  const topics = node.children.map((id) => graph.byId.get(id)!).sort((a, b) => b.children.length - a.children.length);
  const unfiled = graph.nodes.filter((n) => n.kind === 'entry' && !n.topicId && n.domainId === node.id);
  const total = topics.reduce((sum, tp) => sum + tp.children.length, 0) + unfiled.length;
  const max = Math.max(1, ...topics.map((tp) => tp.children.length));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('explore.focus.domain')}</p>
        <h2 className="mt-0.5 flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
          <Swatch cls={node.cls} /> {labelOf(node)}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t('explore.focus.domainSummary', { topics: topics.length, count: total })}
        </p>
      </div>
      <Section title={t('explore.focus.topics')} count={topics.length}>
        <ul className="-mx-2 flex flex-col">
          {topics.map((tp) => (
            <li key={tp.id}>
              <button
                type="button"
                onClick={() => onFocus(tp.id)}
                onMouseEnter={() => onHighlight(tp.id)}
                onMouseLeave={() => onHighlight(null)}
                className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-800 group-hover:text-primary dark:text-zinc-100 dark:group-hover:text-primaryLight">{labelOf(tp)}</span>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <span className="block h-full rounded-full" style={{ width: `${(tp.children.length / max) * 100}%`, background: 'var(--viz-ink-2)' }} />
                </span>
                <span className="w-6 text-right text-xs tabular-nums text-zinc-500">{tp.children.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      {unfiled.length > 0 && (
        <Section title={t('explore.focus.unfiled')} count={unfiled.length}>
          <ul className="-mx-2 flex flex-col">
            {unfiled.map((m) => (
              <NodeRow key={m.id} node={m} label={m.title ?? ''} onFocus={onFocus} onHighlight={onHighlight} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** The right-hand panel of focus mode: what the focused node is and where to walk next. */
export default function FocusPanel({
  graph,
  node,
  labelOf,
  onFocus,
  onHighlight,
  onBack,
  backLabel,
}: {
  graph: ExploreGraph;
  node: ExploreNode;
  labelOf: (n: ExploreNode) => string;
  onFocus: (id: string | null) => void;
  onHighlight: (id: string | null) => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  const { t } = useTranslation();
  const props = { graph, node, labelOf, onFocus: (id: string) => onFocus(id), onHighlight };

  return (
    <aside
      aria-label={t('explore.focus.label')}
      className="pointer-events-auto flex max-h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95"
    >
      <div className="flex items-center gap-1 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FiArrowLeft className="shrink-0" />
            <span className="truncate">{backLabel}</span>
          </button>
        ) : (
          <span className="px-2 text-xs text-zinc-400">{t('explore.focus.mode')}</span>
        )}
        <button
          type="button"
          onClick={() => onFocus(null)}
          aria-label={t('explore.focus.close')}
          title={t('explore.focus.close')}
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <FiX />
        </button>
      </div>
      {/* Keyed by node so each hop starts at the top and fades in. */}
      <div key={node.id} className="animate-fade-in overflow-y-auto px-4 pb-5 pt-4">
        {node.kind === 'entry' ? <EntryFocus {...props} /> : node.kind === 'topic' ? <TopicFocus {...props} /> : <DomainFocus {...props} />}
      </div>
    </aside>
  );
}
