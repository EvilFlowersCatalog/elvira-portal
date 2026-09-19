import { IAssistantStreamHandlers } from '../../../utils/interfaces/assistant';
import useAuth from '../../contexts/useAuthContext';
import { ASSISTANT_URL, AssistantApiError, idsOf, parseSseData, readSse, textOf } from './assistantApi';

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
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(`${import.meta.env.ELVIRA_BASE_URL}${ASSISTANT_URL}/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal,
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
        case 'error':
          handlers.onError(textOf(payload));
          break;
        case 'done':
          handlers.onDone();
          return;
      }
    }
    handlers.onDone();
  };

  return sendChatMessage;
};

export default useSendChatMessage;
