import { IMetadata } from './general/general';

export interface IAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Publication ids the assistant recommended alongside this message. */
  entry_ids?: string[];
  created_at: string;
}

export interface IAssistantChat {
  id: string;
  user_id: string;
  entry_id: string | null;
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
}

export interface IAssistantStartChat {
  entry_id?: string;
  catalog_id?: string;
}

/** Handlers for the SSE events of `POST /assistant/v1/chats/{id}/messages`. */
export interface IAssistantStreamHandlers {
  /** Partial answer text — append it to the message being shown. */
  onChunk: (text: string) => void;
  /** The completed answer — replaces everything received via `onChunk`. */
  onMessage: (text: string) => void;
  /** Publication ids to render as cards. */
  onEntries: (entryIds: string[]) => void;
  /** An error reported inside the stream. */
  onError: (detail: string) => void;
  /** The stream is finished. */
  onDone: () => void;
}
