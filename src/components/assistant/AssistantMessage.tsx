import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useOpenInViewer from '../../hooks/api/assistant/useOpenInViewer';
import { AiMessage } from '../../providers/AppProvider';
import { IEntry } from '../../utils/interfaces/entry';
import { citationsToLinks, findRegion } from '../../utils/func/assistantMessages';
import EntryItem from '../items/entry/display/EntryItem';
import ChatContextChip from './ChatContextChip';
import AnnotationCard from './AnnotationCard';
import ToolActivityLog from './ToolActivityLog';
import RegionCite, { CitedRegion } from './RegionCite';
import useSimilarEntries from '../../hooks/api/entries/useSimilarEntries';

const citeClass =
  'inline-flex items-center px-1.5 py-px mx-0.5 rounded-md text-xs font-medium align-baseline bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 no-underline enabled:hover:underline enabled:hover:bg-sky-500/20 dark:enabled:hover:bg-sky-400/25 disabled:cursor-default';

/**
 * One chat message, rendered the way the viewer's chat renders it: the
 * reader's attachments as chips, the answer as markdown with `[[page:N]]` and
 * `[[region:ID]]` citations that open the book there, the pages the answer
 * was drawn from, and recommended publications as cards.
 */
export default function AssistantMessage({
  msg,
  messages,
  compact,
  onNavigate,
}: {
  msg: AiMessage;
  /** The whole conversation, so region citations can find the region's page. */
  messages: AiMessage[];
  compact?: boolean;
  /** Called before the viewer opens (the drawer closes itself). */
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { aiChatSubject } = useAppContext();
  const openInViewer = useOpenInViewer();
  const { getEntryDetail } = useGetEntryDetail();
  const { getEntryFigures } = useSimilarEntries();

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

  const entryIds = msg.entryIds ?? [];
  // Recommended-book details, cached/deduped by React Query and keyed by the ids.
  const { data: books = [] } = useQuery({
    queryKey: ['ai-message-books', entryIds],
    queryFn: async () => {
      const details = await Promise.all(entryIds.map((id) => getEntryDetail(id)));
      return details.map((detail) => ({ ...detail, popularity: Number(detail.popularity) })) as IEntry[];
    },
    enabled: entryIds.length > 0,
  });

  // Figures the answer cites: the crops come from the entry's extraction, so a hover can show them.
  const citesRegions = msg.role === 'assistant' && msg.text.includes('[[region:');
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

  const markdown = useMemo(
    () =>
      citationsToLinks(msg.text, {
        page: (page) => t('assistant.pageShort', { page }),
        region: (id) => {
          const kind = figures.find((f) => f.id === id)?.kind ?? findRegion(messages, id)?.kind;
          return t(`assistant.region.${kind ?? 'figure'}`);
        },
      }),
    [msg.text, messages, figures, t],
  );

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

  const streaming = msg.status === 'streaming';
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

  return (
    <div className={`self-start flex flex-col gap-2 w-full ${compact ? 'mb-2' : 'mb-4'}`}>
      {msg.activity?.some((call) => call.done) ? (
        <ToolActivityLog activity={msg.activity.filter((call) => call.done)} running={false} />
      ) : null}
      {!msg.text ? liveLine : null}
      {(msg.text || msg.status === 'error') && (
        <div
          className={`rounded-lg break-words ${bubble} ${
            msg.status === 'error'
              ? 'bg-red/10 text-redText dark:text-red'
              : 'bg-zinc-200 text-black dark:bg-[#3f3f46] dark:text-[#e5e7eb]'
          }`}
        >
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    const page = href?.match(/^#efv-page-(\d+)$/)?.[1];
                    const regionId = href?.match(/^#efv-region-([\w-]+)$/)?.[1];
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
                }}
              >
                {markdown || t('assistant.errors.generic')}
              </ReactMarkdown>
            </div>
        </div>
      )}

      {msg.text ? liveLine : null}

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
          {books.map((entry: IEntry) => (
            <div key={'ai-' + entry.id} className="w-[150px] shrink-0">
              <EntryItem entry={entry} id={'ai-' + entry.id} type="ai-recommendation" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
