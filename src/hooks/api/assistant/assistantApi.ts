import { isAxiosError } from 'axios';
import type {
  IAssistantCitation,
  IAssistantEvidence,
  IAssistantStudy,
  IAssistantSuggestion,
} from '../../../utils/interfaces/assistant';

export const ASSISTANT_URL = '/assistant/v1';

/** Failure of an assistant request, normalised from axios / fetch errors. */
export class AssistantApiError extends Error {
  status: number;
  /** Raw `Retry-After` header (seconds or an HTTP date) — set on 429. */
  retryAfter?: string;

  constructor(status: number, detail: string, retryAfter?: string) {
    super(detail);
    this.name = 'AssistantApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

const detailOf = (body: unknown): string => {
  if (body && typeof body === 'object' && 'detail' in body) {
    return String((body as { detail: unknown }).detail);
  }
  return '';
};

/** Normalises whatever a failed assistant call threw into an AssistantApiError. */
export const toAssistantError = (err: unknown): AssistantApiError => {
  if (err instanceof AssistantApiError) return err;
  if (isAxiosError(err) && err.response) {
    const { status, data, headers } = err.response;
    return new AssistantApiError(status, detailOf(data), headers['retry-after']);
  }
  return new AssistantApiError(0, err instanceof Error ? err.message : '');
};

/** `Retry-After` is either a number of seconds or an HTTP date. */
export const formatRetryAfter = (retryAfter?: string): string => {
  if (!retryAfter) return '';
  const seconds = /^\d+$/.test(retryAfter)
    ? Number(retryAfter)
    : Math.ceil((new Date(retryAfter).getTime() - Date.now()) / 1000);
  if (!Number.isFinite(seconds)) return retryAfter;
  if (seconds <= 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 || minutes === 60 ? `${hours} h` : `${hours} h ${minutes} min`;
};

export interface ISseEvent {
  event: string;
  data: string;
}

/**
 * Splits a text/event-stream body into events. `EventSource` cannot POST, so the
 * stream is read from a `fetch` body and framed here (blank line = end of event).
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<ISseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const parse = (block: string): ISseEvent | null => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':')) continue; // comment / keep-alive
      const sep = line.indexOf(':');
      const field = sep === -1 ? line : line.slice(0, sep);
      const value = sep === -1 ? '' : line.slice(sep + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
    }
    return data.length ? { event, data: data.join('\n') } : null;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, '\n');

      let end: number;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const parsed = parse(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (parsed) yield parsed;
      }
      if (done) break;
    }
    const rest = parse(buffer);
    if (rest) yield rest;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Event payloads are JSON objects / arrays / strings, or plain text. Only those
 * JSON shapes are decoded so a bare-text chunk like ` 2024` keeps its spacing.
 */
export const parseSseData = (raw: string): unknown => {
  if (!/^[{["]/.test(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

/** Pulls the text out of a `chunk` / `message` / `error` payload. */
export const textOf = (payload: unknown): string => {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    // `error` last: a failed turn's frame is `{error, message_id, retryable}` (IP-030 §5).
    for (const key of ['text', 'message', 'content', 'detail', 'error']) {
      if (typeof o[key] === 'string') return o[key] as string;
    }
  }
  return '';
};

/** Pulls publication ids out of an `entries` payload. */
export const idsOf = (payload: unknown): string[] => {
  const list =
    Array.isArray(payload) ? payload
    : payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).entry_ids ?? (payload as Record<string, unknown>).entries ?? (payload as Record<string, unknown>).ids)
      : undefined;
  return Array.isArray(list) ? list.map(String) : [];
};

/** Pulls page numbers out of a `pages` payload. */
export const pagesOf = (payload: unknown): number[] => {
  const list =
    Array.isArray(payload) ? payload
    : payload && typeof payload === 'object' ? (payload as Record<string, unknown>).pages
    : undefined;
  return Array.isArray(list) ? list.map(Number).filter((page) => Number.isInteger(page) && page > 0) : [];
};

const isCitation = (c: unknown): c is IAssistantCitation =>
  !!c &&
  typeof c === 'object' &&
  typeof (c as IAssistantCitation).label === 'string' &&
  typeof (c as IAssistantCitation).entry_id === 'string';

/** The resolved labels of a `citations` payload; `unknown` labels are left out, so they render as plain text. */
export const citationsOf = (payload: unknown): IAssistantCitation[] => {
  const list = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).citations : undefined;
  return Array.isArray(list) ? list.filter(isCitation) : [];
};

/** A `citation` payload: one label, the first time the streamed text cites it. */
export const citationOf = (payload: unknown): IAssistantCitation | null => (isCitation(payload) ? payload : null);

/** An `evidence` payload: the sources gathered before the first token. */
export const evidenceOf = (payload: unknown): IAssistantEvidence | null => {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (!Array.isArray(raw.sources)) return null;
  return { sources: raw.sources.filter(isCitation), low_relevance: raw.low_relevance === true };
};

const STUDY_ITEMS: Record<IAssistantStudy['mode'], string> = {
  walkthrough: 'points',
  quiz: 'questions',
  key_concepts: 'concepts',
};

/** A `study` payload, if it is a card the portal can render (its items list present). */
export const studyOf = (payload: unknown): IAssistantStudy | null => {
  if (!payload || typeof payload !== 'object') return null;
  const { mode, data } = payload as { mode?: unknown; data?: unknown };
  if (typeof mode !== 'string' || !(mode in STUDY_ITEMS) || !data || typeof data !== 'object') return null;
  const items = (data as Record<string, unknown>)[STUDY_ITEMS[mode as IAssistantStudy['mode']]];
  return Array.isArray(items) && items.length ? (payload as IAssistantStudy) : null;
};

/** A `suggestions` payload. */
export const suggestionsOf = (payload: unknown): IAssistantSuggestion[] => {
  const list = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).suggestions : undefined;
  return Array.isArray(list)
    ? list.filter(
        (s): s is IAssistantSuggestion =>
          !!s && typeof s === 'object' && typeof s.label === 'string' && typeof s.message === 'string',
      )
    : [];
};

/** The stored row that closed the turn, from a `done` payload `{chat_id, message_id}` (EvilFlowersCatalog#145). */
export const doneIdOf = (payload: unknown): string | undefined => {
  const id = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).message_id : undefined;
  return typeof id === 'string' ? id : undefined;
};

/** The stored row and retry hint of an `error` payload (IP-030 §5). */
export const failureOf = (payload: unknown): { messageId?: string; retryable?: boolean } => {
  if (!payload || typeof payload !== 'object') return {};
  const raw = payload as Record<string, unknown>;
  return {
    ...(typeof raw.message_id === 'string' ? { messageId: raw.message_id } : {}),
    ...(typeof raw.retryable === 'boolean' ? { retryable: raw.retryable } : {}),
  };
};
