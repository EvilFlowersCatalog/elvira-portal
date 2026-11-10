import { AiChatSubject, AiMessage } from '../../providers/AppProvider';
import { IAssistantChat, IAssistantMessage, IChatContext } from '../interfaces/assistant';

const TOOL_STATUS: Record<string, string> = {
  search_entries: 'searchCatalog',
  search_library_text: 'searchTexts',
  find_similar: 'findSimilar',
  get_entry: 'readEntry',
  list_categories: 'listCategories',
  list_my_loans: 'checkLoans',
  get_my_shelf: 'checkLoans',
  read_pdf_page: 'readPublication',
  search_pdf: 'readPublication',
  search_paragraphs: 'readPublication',
};

/**
 * Translation key of the progress line for a `status` event: `thinking` before
 * a model round, or what the tool about to run does (unknown tools: "Working…").
 */
export const statusLabelKey = (state: 'thinking' | 'tool', tool?: string): string => {
  if (state === 'thinking') return 'assistant.thinking';
  const key = tool && (TOOL_STATUS[tool] ?? (tool.includes('region') ? 'readPublication' : undefined));
  return `assistant.status.${key ?? 'working'}`;
};

const TOOL_ACTIVITY: Record<string, string> = {
  search_entries: 'searchCatalog',
  search_library_text: 'searchTexts',
  find_similar: 'findSimilar',
  get_entry: 'readEntry',
  list_categories: 'listCategories',
  list_my_loans: 'checkLoans',
  get_my_shelf: 'checkLoans',
  read_pdf_page: 'readPages',
  search_pdf: 'searchPublication',
  search_paragraphs: 'searchPublication',
  create_highlights: 'highlight',
};

/** Translation key of a finished tool call in the activity log (past tense). */
export const activityLabelKey = (tool: string): string =>
  `assistant.activity.${TOOL_ACTIVITY[tool] ?? (tool.includes('region') ? 'readRegions' : 'working')}`;

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Pages as a short label: "p. 4", "pp. 3–5", or "pp. 3, 9, 12" when not consecutive. */
export const pagesLabel = (pages: number[], t: Translate): string => {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  if (sorted.length === 1) return t('assistant.activity.page', { page: sorted[0] });
  const consecutive = sorted.every((page, index) => index === 0 || page === sorted[index - 1] + 1);
  if (consecutive) return t('assistant.activity.pages', { from: sorted[0], to: sorted[sorted.length - 1] });
  const shown = sorted.slice(0, 6).join(', ');
  return t('assistant.activity.pageList', { pages: sorted.length > 6 ? `${shown}, …` : shown });
};

/**
 * One line for a turn's tool calls, like "Searched the catalog 2×, read the record": distinct labels in
 * order of first use, with how many times each ran.
 */
export const activitySummary = (tools: string[], t: Translate): string => {
  const counts = new Map<string, number>();
  tools.forEach((tool) => {
    const key = activityLabelKey(tool);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([key, count], index) => {
      let label = t(key);
      if (index > 0) label = label.charAt(0).toLocaleLowerCase() + label.slice(1);
      return count > 1 ? `${label} ${t('assistant.activity.times', { count })}` : label;
    })
    .join(', ');
};

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
    annotationIds: msg.annotations?.length ? msg.annotations : undefined,
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
        readable: !chat.entry?.readium_enabled,
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
