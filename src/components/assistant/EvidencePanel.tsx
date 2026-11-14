import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IAssistantCitation, IAssistantEvidence } from '../../utils/interfaces/assistant';
import { chipText, compareLabels, isFigure } from '../../utils/func/assistantMessages';
import { citeClass, useCropUrl } from './citationUi';

interface Group {
  entryId: string;
  title: string;
  sources: IAssistantCitation[];
}

const groupByPublication = (sources: IAssistantCitation[]): Group[] => {
  const groups = new Map<string, Group>();
  [...sources]
    .sort((a, b) => compareLabels(a.label, b.label))
    .forEach((source) => {
      const group = groups.get(source.entry_id) ?? { entryId: source.entry_id, title: source.title ?? '', sources: [] };
      if (!group.title && source.title) group.title = source.title;
      group.sources.push(source);
      groups.set(source.entry_id, group);
    });
  return [...groups.values()];
};

function SourceRow({ source, cited, onOpen }: { source: IAssistantCitation; cited: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  const cropUrl = useCropUrl();
  const image = isFigure(source) ? cropUrl(source.image_url) : undefined;
  const where = [source.page ? t('assistant.pageShort', { page: source.page }) : '', source.section ?? '']
    .filter(Boolean)
    .join(' · ');
  const text = isFigure(source) ? source.caption : source.quote;

  return (
    <button type="button" onClick={onOpen} className="flex items-start gap-2 text-left min-w-0 w-full group">
      <span className={`${citeClass} shrink-0 ${cited ? '' : 'opacity-60'}`}>{chipText(source.label)}</span>
      {image ? (
        <img src={image} alt="" loading="lazy" className="w-12 h-12 shrink-0 object-contain bg-white rounded border border-zinc-200 dark:border-zinc-700" />
      ) : null}
      <span className="min-w-0 flex flex-col">
        <span className="text-gray-700 dark:text-gray-300 group-hover:underline">
          {where || source.title}
          {cited ? <span className="ml-1 text-[10px] uppercase tracking-wide text-sky-700 dark:text-sky-300">{t('assistant.evidence.cited')}</span> : null}
        </span>
        {text ? (
          <span className="text-gray-500 dark:text-gray-400 line-clamp-2">{text}</span>
        ) : source.readable === false ? (
          <span className="text-gray-500 dark:text-gray-400">{t('assistant.evidence.borrow')}</span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * "Zdroje / Sources" (IP-030 Phase 2): what the turn gathered, grouped by publication — filled from the
 * `evidence` frame before the first token. Once the answer is complete the sources it cites are marked and the
 * rest fold away. A turn without an `evidence` frame (the catalog's prefetch is off, or the question needed none)
 * lists just the cited sources. Readium LCP sources carry no text: "borrow the book" opens their detail.
 */
export default function EvidencePanel({
  evidence,
  citations,
  streaming,
  onOpen,
}: {
  evidence?: IAssistantEvidence;
  citations?: IAssistantCitation[];
  streaming: boolean;
  onOpen: (source: IAssistantCitation) => void;
}) {
  const { t } = useTranslation();
  const [showUncited, setShowUncited] = useState(false);

  const cited = new Set((citations ?? []).map((c) => c.label.toUpperCase()));
  // A citation is the completed form of its source: it may carry a better quote (the cited sentence).
  const merged = new Map<string, IAssistantCitation>();
  (evidence?.sources ?? []).forEach((s) => merged.set(s.label.toUpperCase(), s));
  (citations ?? []).forEach((c) => merged.set(c.label.toUpperCase(), { ...merged.get(c.label.toUpperCase()), ...c }));
  const all = [...merged.values()];
  if (!all.length) return evidence?.low_relevance ? <LowRelevance /> : null;

  // While the answer streams everything gathered is shown; after it, the uncited ones fold away.
  const settled = !streaming && cited.size > 0;
  const uncited = all.filter((s) => !cited.has(s.label.toUpperCase())).length;
  const shown = settled && !showUncited ? all.filter((s) => cited.has(s.label.toUpperCase())) : all;

  return (
    <section className="flex flex-col gap-1.5 text-xs" aria-label={t('assistant.evidence.title')}>
      <span className="text-gray-500 dark:text-gray-400">
        {streaming && evidence ? t('assistant.evidence.gathering') : t('assistant.evidence.title')}:
      </span>
      {evidence?.low_relevance ? <LowRelevance /> : null}
      {groupByPublication(shown).map((group) => (
        <div key={group.entryId} className="flex flex-col gap-1 pl-1 border-l-2 border-zinc-300 dark:border-zinc-600">
          <span className="pl-1.5 font-medium text-black dark:text-white truncate">{group.title || group.entryId}</span>
          <div className="flex flex-col gap-1 pl-1.5">
            {group.sources.map((source) => (
              <SourceRow
                key={source.label}
                source={source}
                cited={settled && cited.has(source.label.toUpperCase())}
                onOpen={() => onOpen(source)}
              />
            ))}
          </div>
        </div>
      ))}
      {settled && uncited > 0 ? (
        <button
          type="button"
          onClick={() => setShowUncited((value) => !value)}
          className="self-start text-gray-500 dark:text-gray-400 hover:underline"
          aria-expanded={showUncited}
        >
          {t('assistant.evidence.uncited', { count: uncited })} ·{' '}
          {showUncited ? t('assistant.evidence.hideUncited') : t('assistant.evidence.showUncited')}
        </button>
      ) : null}
    </section>
  );
}

function LowRelevance() {
  const { t } = useTranslation();
  return (
    <p className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300">
      {t('assistant.evidence.lowRelevance')}
    </p>
  );
}
