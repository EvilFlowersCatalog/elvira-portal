import {
  IAssistantAnnotation,
  IAssistantMessageOptions,
  IAssistantStatus,
  IAssistantStreamHandlers,
  IAssistantToolActivity,
} from '../../../utils/interfaces/assistant';
import useAuth from '../../contexts/useAuthContext';
import {
  ASSISTANT_URL,
  AssistantApiError,
  citationOf,
  citationsOf,
  doneIdOf,
  evidenceOf,
  failureOf,
  idsOf,
  pagesOf,
  parseSseData,
  readSse,
  studyOf,
  suggestionsOf,
  textOf,
} from './assistantApi';

/** The readable fields of a `status`/`activity` payload, each checked; anything else is dropped. */
const activityOf = (payload: object): Omit<IAssistantToolActivity, 'id' | 'tool' | 'done'> => {
  const raw = payload as Record<string, unknown>;
  const pages = Array.isArray(raw.pages) ? raw.pages.filter((p): p is number => Number.isInteger(p)) : [];
  const entries = Array.isArray(raw.entries)
    ? raw.entries
        .filter((e): e is { id?: unknown; title: string } => !!e && typeof e === 'object' && typeof e.title === 'string')
        .map((e) => ({ title: e.title, ...(typeof e.id === 'string' ? { id: e.id } : {}) }))
    : [];
  return {
    ...(typeof raw.query === 'string' && raw.query ? { query: raw.query } : {}),
    ...(pages.length ? { pages } : {}),
    ...(typeof raw.count === 'number' ? { count: raw.count } : {}),
    ...(entries.length ? { entries } : {}),
    ...(raw.error === true ? { error: true } : {}),
  };
};

/**
 * Sends a message and dispatches the SSE answer to `handlers`. Uses `fetch`
 * because the endpoint is a POST (`EventSource` can't POST) and axios can't
 * expose a streamed body. Resolves when the stream ends; rejects with an
 * AssistantApiError for 401 / 403 / 404 / 429 responses.
 */
const useSendChatMessage = () => {
  const { auth, logout } = useAuth();

  const sendChatMessage = async (
    chatId: string,
    message: string,
    handlers: IAssistantStreamHandlers,
    options?: IAssistantMessageOptions,
  ): Promise<void> => {
    const response = await fetch(`${import.meta.env.ELVIRA_BASE_URL}${ASSISTANT_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({
        message,
        ...(options?.entryId ? { entry_id: options.entryId } : {}),
        ...(options?.contexts?.length ? { contexts: options.contexts } : {}),
        ...(options?.page ? { page: options.page } : {}),
        ...(options?.userAcquisitionId ? { user_acquisition_id: options.userAcquisitionId } : {}),
        ...(options?.language ? { language: options.language } : {}),
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      // fetch bypasses the axios interceptor, so mirror its 401 handling.
      if (response.status === 401) logout();
      const body = await response.json().catch(() => null);
      throw new AssistantApiError(
        response.status,
        typeof body?.detail === 'string' ? body.detail : '',
        response.headers.get('Retry-After') ?? undefined,
      );
    }
    if (!response.body) throw new AssistantApiError(response.status, '');

    // Tool calls run one after another: `status` opens a call, the next `activity` closes it.
    let calls = 0;
    let open: { id: string; tool: string } | null = null;

    for await (const { event, data } of readSse(response.body)) {
      const payload = parseSseData(data);
      switch (event) {
        case 'chunk':
          handlers.onChunk(textOf(payload));
          break;
        case 'message':
          handlers.onMessage(textOf(payload));
          break;
        case 'entries':
          handlers.onEntries(idsOf(payload));
          break;
        case 'pages':
          handlers.onPages?.(pagesOf(payload));
          break;
        case 'citations':
          handlers.onCitations?.(citationsOf(payload));
          break;
        case 'citation': {
          const citation = citationOf(payload);
          if (citation) handlers.onCitation?.(citation);
          break;
        }
        case 'evidence': {
          const evidence = evidenceOf(payload);
          if (evidence) handlers.onEvidence?.(evidence);
          break;
        }
        case 'study': {
          const study = studyOf(payload);
          if (study) handlers.onStudy?.(study);
          break;
        }
        case 'suggestions':
          handlers.onSuggestions?.(suggestionsOf(payload));
          break;
        case 'annotation':
          if (payload && typeof payload === 'object' && 'id' in payload) {
            handlers.onAnnotation?.(payload as IAssistantAnnotation);
          }
          break;
        case 'status':
          if (payload && typeof payload === 'object') {
            const { state, tool } = payload as IAssistantStatus;
            if (state === 'thinking' || state === 'tool') {
              handlers.onStatus?.(state, typeof tool === 'string' ? tool : undefined);
            }
            if (state === 'tool' && typeof tool === 'string') {
              open = { id: `call-${++calls}`, tool };
              handlers.onActivity?.({ ...activityOf(payload), id: open.id, tool, done: false });
            }
          }
          break;
        case 'activity':
          if (payload && typeof payload === 'object') {
            const tool = String((payload as { tool?: unknown }).tool ?? '');
            // An `activity` with no matching `status` (a skipped one) still gets its own row.
            const id = open && open.tool === tool ? open.id : `call-${++calls}`;
            open = null;
            handlers.onActivity?.({ ...activityOf(payload), id, tool, done: true });
          }
          break;
        case 'error':
          handlers.onError(textOf(payload), failureOf(payload));
          break;
        case 'done':
          handlers.onDone(doneIdOf(payload));
          return;
      }
    }
    handlers.onDone();
  };

  return sendChatMessage;
};

export default useSendChatMessage;
