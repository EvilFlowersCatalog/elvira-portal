import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { FiRotateCcw } from 'react-icons/fi';
import useAppContext from '../../hooks/contexts/useAppContext';
import useAuthContext from '../../hooks/contexts/useAuthContext';
import useOpenInViewer from '../../hooks/api/assistant/useOpenInViewer';
import useOpenCitation from '../../hooks/api/assistant/useOpenCitation';
import useAgentHighlights from '../../hooks/api/assistant/useAgentHighlights';
import useEntriesByIds from '../../hooks/api/entries/useEntriesByIds';
import { AiMessage } from '../../providers/AppProvider';
import { IAssistantCitation } from '../../utils/interfaces/assistant';
import {
  citationsToLinks,
  findCitation,
  findRegion,
  figureLabelsIn,
  markdownBlocks,
  normalizeCitations,
} from '../../utils/func/assistantMessages';
import EntryItem from '../items/entry/display/EntryItem';
import ChatContextChip from './ChatContextChip';
import AnnotationCard from './AnnotationCard';
import ToolActivityLog from './ToolActivityLog';
import RegionCite, { CitedRegion } from './RegionCite';
import CitationChip from './CitationChip';
import FigureCard from './FigureCard';
import { citeClass, figureContext } from './citationUi';
import EvidencePanel from './EvidencePanel';
import StudyCard from './StudyCard';
import SuggestionChips from './SuggestionChips';
import AnswerFeedback from './AnswerFeedback';
import GuideCard from '../guide/GuideCard';
import useSimilarEntries from '../../hooks/api/entries/useSimilarEntries';
import { ISendOptions } from '../../hooks/api/assistant/useAssistantChat';

/**
 * One chat message, rendered the way the viewer's chat renders it: the
 * reader's attachments as chips, the answer as markdown with evidence chips (`[E3]`, `[F2]`) and the older
 * `[[page:N]]` / `[[region:ID]]` citations, the figures it cites as cards under their paragraph, the sources
 * it was drawn from, a study card when that is the answer, follow-up chips and recommended publications.
 */
export default function AssistantMessage({
  msg,
  messages,
  compact,
  onNavigate,
  onSend,
  onRetry,
}: {
  msg: AiMessage;
  /** The whole conversation, so region citations can find the region's page. */
  messages: AiMessage[];
  compact?: boolean;
  /** Called before the viewer opens (the drawer closes itself). */
  onNavigate?: () => void;
  /** Sends a follow-up (suggestion chips, "ask about this figure", next walkthrough step); unset while busy. */
  onSend?: (message: string, options?: ISendOptions) => void;
  /** Sends a failed message again; unset while busy. */
  onRetry?: (msg: AiMessage) => void;
}) {
  const { t } = useTranslation();
  const { aiChatSubject, lang } = useAppContext();
  const { auth } = useAuthContext();
  const openInViewer = useOpenInViewer();
  const openCitation = useOpenCitation();
  const { getEntryFigures } = useSimilarEntries();
  const { requestAgentAnnotation } = useAgentHighlights();

  // The book this answer is about: the chat's own, else the one attached to the question before it
  // (a general chat where the reader picked a book: "a čo v tejto knihe…").
  const subject = useMemo(() => {
    if (aiChatSubject) return aiChatSubject;
    const index = messages.findIndex((m) => m.id === msg.id);
    const asked = messages
      .slice(0, index < 0 ? messages.length : index)
      .reverse()
      .find((m) => m.role === 'user' && m.reference?.id);
    return asked?.reference ? { entryId: asked.reference.id, title: asked.reference.title } : null;
  }, [aiChatSubject, messages, msg.id]);

  // A Readium book is borrowed, never opened here, so its page citations stay plain labels.
  const openPage = subject && subject.readable !== false
    ? (page: number) => {
        onNavigate?.();
        openInViewer(subject, page);
      }
    : undefined;
  const open = (citation: IAssistantCitation) => openCitation(citation, onNavigate);

  // Recommended books in one `?id=` request (#14), cached by the ids.
  const { data: books = [] } = useEntriesByIds(msg.entryIds ?? []);

  // Figures cited the old way (`[[region:ID]]`): the crops come from the entry's extraction, so a hover can show them.
  const citesRegions = msg.role === 'assistant' && msg.text.includes('region:');
  const { data: figures = [] } = useQuery({
    queryKey: ['entry-figures', subject?.entryId],
    queryFn: () => getEntryFigures(subject!.entryId),
    enabled: citesRegions && !!subject?.entryId && subject.readable !== false,
    staleTime: 5 * 60 * 1000,
  });
  const citedRegion = (id: string): CitedRegion | null => {
    const figure = figures.find((f) => f.id === id);
    if (figure) {
      return {
        kind: figure.kind,
        page: figure.page,
        caption: figure.printed_caption || figure.caption,
        description: figure.description,
        imageUrl: figure.image_url,
      };
    }
    const region = findRegion(messages, id);
    return region
      ? {
          kind: region.kind,
          page: region.page,
          caption: region.printedCaption || region.caption,
          description: region.description,
          imageUrl: region.imageUrl,
        }
      : null;
  };

  const streaming = msg.status === 'streaming';

  // The answer in markdown blocks, each with the figures it cites, so their cards go under that paragraph.
  const blocks = useMemo(
    () =>
      markdownBlocks(normalizeCitations(msg.text)).map((block) => ({
        markdown: citationsToLinks(block, {
          page: (page) => t('assistant.pageShort', { page }),
          region: (id) => {
            const kind = figures.find((f) => f.id === id)?.kind ?? findRegion(messages, id)?.kind;
            return t(`assistant.region.${kind ?? 'figure'}`);
          },
        }, msg.citations, streaming),
        figures: figureLabelsIn(block)
          .map((label) => findCitation(msg.citations, label))
          .filter((c): c is IAssistantCitation => !!c),
      })),
    [msg.text, msg.citations, streaming, messages, figures, t],
  );

  const askAboutFigure = onSend
    ? (citation: IAssistantCitation) => {
        const context = figureContext(citation);
        onSend(t('assistant.figure.askMessage', { label: citation.label }), {
          contexts: context ? [context] : undefined,
          entry: { id: citation.entry_id, title: citation.title },
        });
      }
    : undefined;

  const components: Components = {
    a: ({ href, children }) => {
      const page = href?.match(/^#efv-page-(\d+)$/)?.[1];
      const regionId = href?.match(/^#efv-region-([\w-]+)$/)?.[1];
      const evidence = href?.match(/^#efv-evidence-([EF]\d+)$/)?.[1];
      if (evidence) {
        // Inert until its `citation` frame arrives; then hover shows the source, click opens it.
        return (
          <CitationChip citation={findCitation(msg.citations, evidence)} onOpen={open}>
            {children}
          </CitationChip>
        );
      }
      if (regionId) {
        return (
          <RegionCite region={citedRegion(regionId)} className={citeClass} onOpenPage={openPage}>
            {children}
          </RegionCite>
        );
      }
      if (page) {
        const target = Number(page);
        return (
          <button
            type="button"
            className={citeClass}
            disabled={!openPage || !target}
            onClick={() => target && openPage?.(target)}
          >
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" className="underline">
          {children}
        </a>
      );
    },
  };

  const bubble = compact ? 'p-2 max-w-[85%]' : 'px-4 py-3 max-w-[85%]';

  if (msg.role === 'user') {
    return (
      <div className={`self-end flex flex-col items-end gap-1 ${compact ? 'mb-2 max-w-[85%]' : 'mb-4 max-w-[85%]'}`}>
        {msg.contexts?.length ? (
          <div className="flex flex-wrap justify-end gap-1">
            {msg.contexts.map((ctx, index) => (
              <ChatContextChip key={index} context={ctx} onOpenPage={openPage} />
            ))}
          </div>
        ) : null}
        <div className={`rounded-lg bg-primary text-white whitespace-pre-wrap break-words ${compact ? 'p-2' : 'p-4'}`}>
          {msg.reference?.title && <p className="text-xs opacity-80 mb-1 truncate">📖 {msg.reference.title}</p>}
          {msg.text}
        </div>
      </div>
    );
  }

  // What runs right now, as one plain line (no bubble): before any text, and again when a later
  // round calls a tool after text already streamed. Text streaming clears `progress`.
  const working = streaming && (!msg.text || !!msg.progress);
  const runningCall = streaming ? msg.activity?.filter((call) => !call.done).pop() : undefined;
  const liveLine = working ? (
    <div className="flex items-center gap-2 px-1 text-xs min-w-0" aria-live="polite">
      <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-primary animate-pulse" aria-hidden="true" />
      <span className="shrink-0 text-gray-500 dark:text-gray-400">{t(msg.progress ?? 'assistant.thinking')}</span>
      {runningCall?.query ? (
        <span className="truncate text-gray-700 dark:text-gray-300">{runningCall.query}</span>
      ) : null}
    </div>
  ) : null;

  const failed = msg.status === 'error';
  // A study card is the whole answer of its turn: there is no text to rate apart from it.
  const answered = !streaming && !failed && (!!msg.text || !!msg.study || !!msg.entryIds?.length);

  return (
    <div className={`self-start flex flex-col gap-2 w-full ${compact ? 'mb-2' : 'mb-4'}`}>
      {msg.activity?.some((call) => call.done) ? (
        <ToolActivityLog activity={msg.activity.filter((call) => call.done)} running={false} />
      ) : null}

      {/* Sources, from the `evidence` frame before the first token; cited ones marked once the answer is in */}
      {msg.evidence || (msg.citations?.length && !streaming) ? (
        <EvidencePanel evidence={msg.evidence} citations={msg.citations} streaming={streaming} onOpen={open} />
      ) : null}

      {!msg.text ? liveLine : null}
      {(msg.text || failed) && (
        <div
          className={`rounded-lg break-words ${bubble} ${
            failed
              ? 'bg-red/10 text-redText dark:text-red'
              : 'bg-zinc-200 text-black dark:bg-[#3f3f46] dark:text-[#e5e7eb]'
          }`}
        >
          {failed || !blocks.length ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {msg.text || t('assistant.errors.generic')}
            </ReactMarkdown>
          ) : (
            blocks.map((block, index) => (
              <div key={index} className={index > 0 ? 'mt-3' : undefined}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {block.markdown}
                </ReactMarkdown>
                {block.figures.map((figure) => (
                  <FigureCard
                    key={figure.label}
                    citation={figure}
                    onOpen={figure.readable === false && !figure.page ? undefined : open}
                    onAsk={askAboutFigure}
                  />
                ))}
              </div>
            ))
          )}
          {failed && msg.retry && onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(msg)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white/70 dark:bg-zinc-800 text-black dark:text-white hover:bg-white dark:hover:bg-zinc-700"
            >
              <FiRotateCcw size={12} aria-hidden="true" /> {t('assistant.retry')}
            </button>
          ) : null}
        </div>
      )}

      {msg.text ? liveLine : null}

      {/* Places in the portal the answer offers to show */}
      {msg.guide ? <GuideCard guide={msg.guide} /> : null}

      {/* The answer as a study card: quiz, walkthrough or glossary */}
      {msg.study ? (
        <StudyCard
          study={msg.study}
          resolve={(label) => findCitation(msg.citations, label) ?? findCitation(msg.evidence?.sources, label)}
          onOpen={open}
          onSend={onSend ? (message) => onSend(message) : undefined}
          onHighlight={
            subject?.userAcquisitionId && msg.study.mode === 'key_concepts'
              ? async (prompt) => {
                  const annotation = await requestAgentAnnotation(subject.userAcquisitionId!, prompt, lang);
                  if (annotation.status === 'failed') throw new Error('highlight-failed');
                }
              : undefined
          }
        />
      ) : null}

      {/* Pages the answer was drawn from */}
      {msg.pagesRead?.length ? (
        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{t('assistant.sources')}:</span>
          {msg.pagesRead.map((page) => (
            <button key={page} type="button" className={citeClass} disabled={!openPage} onClick={() => openPage?.(page)}>
              {t('assistant.pageShort', { page })}
            </button>
          ))}
        </div>
      ) : null}

      {/* AI highlights the assistant created; they open in the viewer */}
      {msg.annotationIds?.length ? (
        <div className="flex flex-col gap-1.5">
          {msg.annotationIds.map((id) => (
            <AnnotationCard
              key={id}
              annotationId={id}
              onOpen={
                aiChatSubject && aiChatSubject.readable !== false
                  ? (page) => {
                      onNavigate?.();
                      openInViewer(aiChatSubject, page);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : null}

      {/* Recommended publications */}
      {books.length ? (
        <div className="flex gap-3 py-2 shrink-0 overflow-x-auto flex-nowrap">
          {books.map((entry) => (
            <div key={'ai-' + entry.id} className="w-[150px] shrink-0">
              <EntryItem entry={entry} id={'ai-' + entry.id} type="ai-recommendation" />
            </div>
          ))}
        </div>
      ) : null}

      {msg.suggestions?.length ? (
        <SuggestionChips suggestions={msg.suggestions} onSend={onSend ? (message) => onSend(message) : undefined} />
      ) : null}

      {/* Rating needs an account: the catalog stores it on the reader's own chat. */}
      {answered && auth?.token ? <AnswerFeedback msg={msg} /> : null}
    </div>
  );
}
