import type { IChatContext } from '@evilflowers/evilflowersviewer';
import { IMetadata } from './general/general';

export type { IChatContext };

export interface IAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Publication the reader attached to this message ("ask about this book"). */
  entry_id: string | null;
  /** What the reader attached in the viewer: selections, explanations, regions, highlights. */
  contexts: IChatContext[] | null;
  /** Viewer page the reader was on when they sent the message. */
  page: number | null;
  /** Viewer pages the answer was drawn from. */
  pages_read: number[] | null;
  /** Publication ids the assistant showed alongside this message. */
  displayed_entries: string[] | null;
  /** Agent annotation (AI highlights) ids the assistant created with this answer (IP-018). */
  annotations?: string[] | null;
  /** The tool calls of the turn this answer closed (the activity log), rebuilt by the catalog. */
  activity?: Omit<IAssistantToolActivity, 'done'>[] | null;
  /** Evidence labels cited in `text` (`[E3]`), resolved to publication and page (IP-024). */
  citations?: IAssistantCitation[] | null;
  tokens_used: number;
  created_at: string;
}

/** An evidence label of an answer (`[E3]`) resolved to a publication and page (IP-024). */
export interface IAssistantCitation {
  label: string;
  entry_id: string;
  title?: string;
  page?: number;
  section?: string;
}

export interface IAssistantChatEntry {
  id: string;
  catalog_id: string;
  title: string;
  /** Lent through Readium LCP: borrowed, never opened in the viewer. */
  readium_enabled?: boolean;
}

export interface IAssistantChat {
  id: string;
  user_id: string;
  entry_id: string | null;
  /** The publication the chat is about, if any. */
  entry: IAssistantChatEntry | null;
  /** The reader's copy the chat is bound to (set when it was opened in the viewer). */
  user_acquisition_id: string | null;
  /** The file of that copy, so the chat can reopen it in the viewer. */
  acquisition_id: string | null;
  catalog_id: string | null;
  title: string;
  is_active: boolean;
  message_count: number;
  total_tokens: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAssistantChatDetail extends IAssistantChat {
  messages: IAssistantMessage[];
}

export interface IAssistantChatList {
  items: IAssistantChat[];
  metadata: IMetadata;
}

export interface IAssistantChatQuery {
  page?: number;
  limit?: number;
  orderBy?: string;
  /** Only the chats about this publication. */
  entryId?: string;
}

export interface IAssistantStartChat {
  entry_id?: string;
  catalog_id?: string;
  /** The reader's copy, when the chat starts in the viewer. */
  user_acquisition_id?: string;
}

/** What goes with a message besides its text. */
export interface IAssistantMessageOptions {
  /** Publication the reader is asking about with this message. */
  entryId?: string;
  contexts?: IChatContext[];
  /** Viewer page the reader is on. */
  page?: number;
  /** The reader's current copy of the chat's publication. */
  userAcquisitionId?: string;
  /** UI language (`sk`, `en`); the answer is written in it. */
  language?: string;
  signal?: AbortSignal;
}

/** Handlers for the SSE events of `POST /assistant/v1/chats/{id}/messages`. */
export interface IAssistantStreamHandlers {
  /** Partial answer text — append it to the message being shown. */
  onChunk: (text: string) => void;
  /** The completed answer — replaces everything received via `onChunk`. */
  onMessage: (text: string) => void;
  /** Publication ids to render as cards. */
  onEntries: (entryIds: string[]) => void;
  /** Viewer pages the answer was drawn from. */
  onPages?: (pages: number[]) => void;
  /** Evidence labels of the answer resolved to publication and page (`citations` event, IP-024). */
  onCitations?: (citations: IAssistantCitation[]) => void;
  /** An agent annotation the assistant started (AI highlights), as `/assistant/v1/highlights` returns it. */
  onAnnotation?: (annotation: IAssistantAnnotation) => void;
  /**
   * Progress before a model round (`thinking`) or a tool call (`tool`, with its
   * name). Shown until text streams or the turn ends; never stored (IP-022).
   */
  onStatus?: (state: IAssistantStatus['state'], tool?: string) => void;
  /**
   * A tool call of this turn for the activity log: sent when it starts (`done: false`, from the
   * `status` event) and again when it finished (`done: true`, from the `activity` event), same `id`.
   */
  onActivity?: (activity: IAssistantToolActivity) => void;
  /** An error reported inside the stream. */
  onError: (detail: string) => void;
  /** The stream is finished. */
  onDone: () => void;
}

/** The `status` SSE event: what the assistant is doing before text streams (IP-022). */
export interface IAssistantStatus {
  state: 'thinking' | 'tool';
  /** Model round, numbered from 1 (`thinking` only). */
  round?: number;
  /** Tool about to run (`tool` only). */
  tool?: string;
  /** Readable query or request of the call (`tool` only). */
  query?: string;
  /** Pages the call reads (`tool` only). */
  pages?: number[];
}

/** One tool call of a turn, as the chat's activity log shows it (`status` + `activity` SSE events). Never stored. */
export interface IAssistantToolActivity {
  /** Stable within the turn. */
  id: string;
  tool: string;
  /** The query or request the model used. */
  query?: string;
  /** Pages read or matched. */
  pages?: number[];
  /** Number of results. */
  count?: number;
  /** Publications it found, by title (ids only for linking). */
  entries?: { id?: string; title: string }[];
  error?: boolean;
  done: boolean;
}

/** An agent annotation as `/assistant/v1/highlights` returns it (IP-018). */
export interface IAssistantAnnotation {
  id: string;
  title: string;
  prompt: string | null;
  summary: string | null;
  status: 'pending' | 'done' | 'failed';
  unresolved_count: number | null;
  highlights: {
    id: string;
    seq: number;
    page: number;
    quads: { x0: number; y0: number; x1: number; y1: number }[];
    text: string;
    note: string | null;
  }[];
}
