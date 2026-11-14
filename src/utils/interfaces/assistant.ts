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
  /** The study card this turn produced (IP-030 §6), as the `study` frame carried it. */
  study?: IAssistantStudy | null;
  /** Set on a failed turn (IP-030 §5): the row holds the notice, `text`, instead of an answer. */
  error?: string | null;
  /** The reader's rating of this answer. */
  feedback?: IAssistantFeedback | null;
  tokens_used: number;
  created_at: string;
}

/** A box on a page as fractions of its size, origin top-left (the coordinates of agent highlights, IP-018). */
export interface IAssistantBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * An evidence label of an answer resolved to a publication and page (IP-024), completed for the portal
 * (IP-030 §2): `E#` a passage, `F#` a figure, table or equation. `quote`, `caption` and `image_url` are absent
 * where the reader may not read the text outside the viewer (Readium LCP, outside IP ranges): `readable: false`.
 */
export interface IAssistantCitation {
  label: string;
  entry_id: string;
  /** `passage`, or `figure` / `table` / `equation` for an `F#` label. */
  kind?: string;
  title?: string;
  page?: number;
  section?: string;
  /** A passage's paragraph, its box on the page and the quads of its best sentence. */
  paragraph_id?: string;
  bbox?: IAssistantBox;
  quads?: IAssistantBox[];
  /** The page the `quads` are on, when the sentence continues on the next page. */
  sentence_page?: number;
  quote?: string;
  /** A figure's region, its printed caption and the crop. */
  region_id?: string;
  caption?: string;
  image_url?: string;
  readable?: boolean;
  /** Relevance of an `evidence` source. */
  score?: number;
}

/**
 * A way through the portal the answer offers (the `navigate` SSE frame, or the portal's own reading of a
 * "where is …" question). Places are ids of the portal's guide registry, never URLs; unknown ids are dropped.
 */
export interface IAssistantGuide {
  /** Places to show, in order: one is a "show me", several a short walk. */
  targets: string[];
  /** A named tour instead (`portal`, `find-book`, `account`, `admin`). */
  tour?: string;
  /** Start right away when the answer is finished (live turns only, never from history). */
  auto?: boolean;
  /** `assistant`: the model asked for it; `portal`: the portal recognised the question itself. */
  source: 'assistant' | 'portal';
}

/** The `evidence` SSE frame (IP-030 §1): what the turn gathered before the model's first token. */
export interface IAssistantEvidence {
  sources: IAssistantCitation[];
  /** The library may not cover the question well. */
  low_relevance: boolean;
}

/** A chip under the last answer (`suggestions` frame); a click sends `message`. */
export interface IAssistantSuggestion {
  label: string;
  message: string;
  kind: string;
}

export interface IAssistantWalkthrough {
  entry_id: string;
  title: string;
  section: string;
  page_range: [number, number];
  part: number;
  has_more: boolean;
  points: { text: string; labels: string[] }[];
  /** The step after this one, or null at the end of the publication. */
  next: { section: string; part: number } | null;
  prerequisites?: { entry_id: string; section: string; page: number }[];
}

export interface IAssistantQuiz {
  entry_id: string;
  title: string;
  section: string;
  page_range: [number, number];
  questions: { question: string; options: string[]; answer_index: number; explanation: string; labels: string[] }[];
}

export interface IAssistantKeyConcepts {
  entry_id: string;
  title: string;
  section: string;
  page_range: [number, number];
  concepts: { term: string; definition: string; labels: string[] }[];
}

/** The `study` SSE frame: a card that is the turn's answer (IP-030 §6). */
export type IAssistantStudy =
  | { mode: 'walkthrough'; data: IAssistantWalkthrough }
  | { mode: 'quiz'; data: IAssistantQuiz }
  | { mode: 'key_concepts'; data: IAssistantKeyConcepts };

export interface IAssistantFeedback {
  rating: 1 | -1;
  reason?: string;
}

/** `GET /assistant/v1/capabilities`: the capability card and starter prompts, in the UI language. */
export interface IAssistantCapabilities {
  capabilities: { id: string; label: string; example: string }[];
  starters: string[];
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
  /** The portal page the reader is on (`/administration/users`), so "where is …" can be answered from here. */
  portalPath?: string;
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
  /** One label, the first time the streamed text cites it (`citation` event, IP-030 §2). */
  onCitation?: (citation: IAssistantCitation) => void;
  /** What the turn gathered before the first token (`evidence` event, IP-030 §1). */
  onEvidence?: (evidence: IAssistantEvidence) => void;
  /** A study card that is this turn's answer (`study` event). */
  onStudy?: (study: IAssistantStudy) => void;
  /** Follow-up chips for the answer (`suggestions` event). */
  onSuggestions?: (suggestions: IAssistantSuggestion[]) => void;
  /** An agent annotation the assistant started (AI highlights), as `/assistant/v1/highlights` returns it. */
  onAnnotation?: (annotation: IAssistantAnnotation) => void;
  /** A place in the portal to show the reader (`navigate` event). */
  onNavigate?: (guide: IAssistantGuide) => void;
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
  /**
   * An error reported inside the stream. A failed turn is stored (IP-030 §5): `messageId` is its row, and
   * `retryable` says the same message may be sent again.
   */
  onError: (detail: string, failure?: { messageId?: string; retryable?: boolean }) => void;
  /**
   * The stream is finished. `messageId` is the stored row that closed the turn (the answer, or the failure
   * notice), from `done` (EvilFlowersCatalog#145); absent when the stream ended without a `done` frame.
   */
  onDone: (messageId?: string) => void;
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
