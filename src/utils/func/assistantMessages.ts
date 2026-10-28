import { AiChatSubject, AiMessage } from '../../providers/AppProvider';
import { IAssistantChat, IAssistantMessage, IChatContext } from '../interfaces/assistant';

/** Stored messages as the chat shows them — the same fields the viewer reads back. */
export const fromApiMessages = (messages: IAssistantMessage[]): AiMessage[] =>
  messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    text: msg.text,
    reference: msg.entry_id ? { id: msg.entry_id } : undefined,
    contexts: msg.contexts ?? undefined,
    page: msg.page,
    entryIds: msg.displayed_entries ?? undefined,
    pagesRead: msg.pages_read ?? undefined,
    status: 'done',
  }));

/** The publication a stored chat is about, or null for a general chat. */
export const subjectOf = (chat: IAssistantChat): AiChatSubject | null =>
  chat.entry_id
    ? {
        entryId: chat.entry_id,
        catalogId: chat.entry?.catalog_id ?? chat.catalog_id,
        title: chat.entry?.title,
        acquisitionId: chat.acquisition_id,
      }
    : null;

/** Page a viewer context points to. */
export const contextPage = (ctx: IChatContext): number => {
  switch (ctx.kind) {
    case 'region':
      return ctx.region.page;
    case 'highlight':
      return ctx.highlight.page;
    default:
      return ctx.page;
  }
};

/** A region attached anywhere in the chat, so `[[region:ID]]` citations can find their page. */
export const findRegion = (messages: AiMessage[], regionId: string) => {
  for (const msg of messages) {
    for (const ctx of msg.contexts ?? []) {
      if (ctx.kind === 'region' && ctx.region.id === regionId) return ctx.region;
    }
  }
  return null;
};

/**
 * Turns the assistant's citation tokens into markdown links the message
 * renderer recognises: `[[page:12]]` → `#efv-page-12`, `[[region:ID]]` → `#efv-region-ID`.
 */
export const citationsToLinks = (
  text: string,
  labels: { page: (page: number) => string; region: (id: string) => string },
): string =>
  text
    .replace(/\[\[page:(\d+)\]\]/g, (_, page) => `[${labels.page(Number(page))}](#efv-page-${page})`)
    .replace(/\[\[region:([\w-]+)\]\]/g, (_, id) => `[${labels.region(id)}](#efv-region-${id})`);
