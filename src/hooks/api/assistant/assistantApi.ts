import { isAxiosError } from 'axios';

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
    for (const key of ['text', 'message', 'content', 'detail']) {
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
