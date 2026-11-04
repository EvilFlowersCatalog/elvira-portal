import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CircleLoader } from 'react-spinners';
import { RiMarkPenLine } from 'react-icons/ri';
import useAgentHighlights from '../../hooks/api/assistant/useAgentHighlights';

/**
 * An AI highlight layer the assistant created from the chat (IP-018 Phase 8):
 * its title and progress, and "open in viewer" at its first highlight once done.
 */
export default function AnnotationCard({
  annotationId,
  onOpen,
}: {
  annotationId: string;
  /** Opens the chat's publication at a page; omitted when it cannot be opened here. */
  onOpen?: (page: number) => void;
}) {
  const { t } = useTranslation();
  const { getAgentAnnotation } = useAgentHighlights();

  const { data: annotation, isError } = useQuery({
    queryKey: ['agent-annotation', annotationId],
    queryFn: () => getAgentAnnotation(annotationId),
    // Followed while the agent is marking passages.
    refetchInterval: (query) => (query.state.data?.status === 'pending' || !query.state.data ? 3000 : false),
  });

  const status = isError ? 'failed' : (annotation?.status ?? 'pending');
  const first = annotation ? [...annotation.highlights].sort((a, b) => a.seq - b.seq)[0] : undefined;
  const canOpen = status === 'done' && !!onOpen;

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={() => onOpen?.(first?.page ?? 1)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-left enabled:hover:shadow-md transition disabled:cursor-default"
    >
      <span className="size-5 shrink-0 flex items-center justify-center text-sky-600 dark:text-sky-300">
        {status === 'pending' ? <CircleLoader size={16} color="#0077cc" /> : <RiMarkPenLine size={18} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-black dark:text-white truncate">
          {annotation?.title || t('assistant.highlights.title')}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {status === 'pending'
            ? t('assistant.highlights.pending')
            : status === 'failed'
              ? t('assistant.highlights.failed')
              : t('assistant.highlights.done', { count: annotation?.highlights.length ?? 0 })}
        </span>
      </span>
      {canOpen && <span className="text-xs font-medium text-sky-700 dark:text-sky-300 shrink-0">{t('assistant.highlights.open')}</span>}
    </button>
  );
}
