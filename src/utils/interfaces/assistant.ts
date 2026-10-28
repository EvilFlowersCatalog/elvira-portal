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
  tokens_used: number;
  created_at: string;
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
  /** An error reported inside the stream. */
  onError: (detail: string) => void;
  /** The stream is finished. */
  onDone: () => void;
}
