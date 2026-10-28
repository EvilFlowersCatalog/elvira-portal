import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CircleLoader } from 'react-spinners';
import { useTranslation } from 'react-i18next';
import useAppContext from '../../hooks/contexts/useAppContext';
import useGetEntryDetail from '../../hooks/api/entries/useGetEntryDetail';
import useOpenInViewer from '../../hooks/api/assistant/useOpenInViewer';
import { AiMessage } from '../../providers/AppProvider';
import { IEntry } from '../../utils/interfaces/entry';
import { citationsToLinks, findRegion } from '../../utils/func/assistantMessages';
import EntryItem from '../items/entry/display/EntryItem';
import ChatContextChip from './ChatContextChip';

const citeClass =
  'inline-flex items-center px-1.5 py-px mx-0.5 rounded-md text-xs font-medium align-baseline bg-primary/15 text-primary dark:text-white no-underline enabled:hover:bg-primary/25 disabled:cursor-default';

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

  const openPage = aiChatSubject
    ? (page: number) => {
        onNavigate?.();
        openInViewer(aiChatSubject, page);
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

  const markdown = useMemo(
    () =>
      citationsToLinks(msg.text, {
        page: (page) => t('assistant.pageShort', { page }),
        region: (id) => {
          const region = findRegion(messages, id);
          return t(`assistant.region.${region?.kind ?? 'figure'}`);
        },
      }),
    [msg.text, messages, t],
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

  const thinking = msg.status === 'streaming' && !msg.text;

  return (
    <div className={`self-start flex flex-col gap-2 w-full ${compact ? 'mb-2' : 'mb-4'}`}>
      {(msg.text || thinking || msg.status === 'error') && (
        <div
          className={`rounded-lg break-words ${bubble} ${
            msg.status === 'error'
              ? 'bg-red/10 text-redText dark:text-red'
              : 'bg-zinc-200 text-black dark:bg-[#3f3f46] dark:text-[#e5e7eb]'
          }`}
        >
          {thinking ? (
            <div className="flex items-center gap-2">
              <CircleLoader size={16} color={'var(--color-primary)'} />
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('assistant.thinking')}</p>
            </div>
          ) : (
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => {
                    const page = href?.match(/^#efv-page-(\d+)$/)?.[1];
                    const regionId = href?.match(/^#efv-region-([\w-]+)$/)?.[1];
                    if (page || regionId) {
                      const target = page ? Number(page) : findRegion(messages, regionId!)?.page;
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
          )}
        </div>
      )}

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
