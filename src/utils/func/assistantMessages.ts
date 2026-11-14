import { AiChatSubject, AiMessage } from '../../providers/AppProvider';
import { IAssistantChat, IAssistantCitation, IAssistantMessage, IChatContext } from '../interfaces/assistant';

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

/**
 * Stored messages as the chat shows them — the same fields the viewer reads back. A failed turn's row (IP-030
 * §5) shows as an error with "try again", which sends the question before it once more.
 */
export const fromApiMessages = (messages: IAssistantMessage[]): AiMessage[] =>
  messages.map((msg, index) => {
    // Only the chat's last failure is offered again; an earlier one was answered or retried since.
    const last = !messages.slice(index + 1).some((m) => m.role === 'assistant');
    const asked =
      msg.error && last ? messages.slice(0, index).reverse().find((m) => m.role === 'user') : undefined;
    return {
      id: msg.id,
      serverId: msg.role === 'assistant' ? msg.id : undefined,
      role: msg.role,
      text: msg.text,
      reference: msg.entry_id ? { id: msg.entry_id } : undefined,
      contexts: msg.contexts ?? undefined,
      page: msg.page,
      entryIds: msg.displayed_entries ?? undefined,
      pagesRead: msg.pages_read ?? undefined,
      citations: msg.citations?.length ? msg.citations : undefined,
      annotationIds: msg.annotations?.length ? msg.annotations : undefined,
      activity: msg.activity?.length ? msg.activity.map((call) => ({ ...call, done: true })) : undefined,
      study: msg.study ?? undefined,
      feedback: msg.feedback ?? undefined,
      retry: asked
        ? { message: asked.text, entryId: asked.entry_id ?? undefined, contexts: asked.contexts ?? undefined }
        : undefined,
      status: msg.error ? 'error' : 'done',
    };
  });

/** The publication a stored chat is about, or null for a general chat. */
export const subjectOf = (chat: IAssistantChat): AiChatSubject | null =>
  chat.entry_id
    ? {
        entryId: chat.entry_id,
        catalogId: chat.entry?.catalog_id ?? chat.catalog_id,
        title: chat.entry?.title,
        acquisitionId: chat.acquisition_id,
        readable: !chat.entry?.readium_enabled,
        userAcquisitionId: chat.user_acquisition_id,
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
 * Citation tokens as the model actually writes them, made canonical: `[[page:7], [page:13]]`,
 * `[page:7]` and `[[page:7, 13]]` all become one `[[page:N]]` per page (same for regions).
 */
export const normalizeCitations = (text: string): string =>
  text
    .replace(/\[+\s*page:\s*(\d+(?:\s*,\s*(?:page:\s*)?\d+)+)\s*\]+/g, (_, list: string) =>
      list
        .split(',')
        .map((page) => `[[page:${page.replace(/\D/g, '')}]]`)
        .join(', '),
    )
    .replace(/\[+\s*(page|region):\s*([\w-]+)\s*\]+/g, '[[$1:$2]]');

/**
 * Turns the assistant's citation tokens into markdown links the message
 * renderer recognises: `[[page:12]]` → `#efv-page-12`, `[[region:ID]]` → `#efv-region-ID`.
 */
export const citationsToLinks = (
  text: string,
  labels: { page: (page: number) => string; region: (id: string) => string },
  citations: IAssistantCitation[] = [],
  pending = false,
): string =>
  evidenceToLinks(normalizeCitations(text), citations, pending)
    .replace(/\[\[page:(\d+)\]\]/g, (_, page) => `[${labels.page(Number(page))}](#efv-page-${page})`)
    .replace(/\[\[region:([\w-]+)\]\]/g, (_, id) => `[${labels.region(id)}](#efv-region-${id})`);

// Evidence labels as the model writes them: `[E3]`, `[E3, F2]`, `[E3; E5]`; `[E3][E5]` is two groups.
// `E#` is a passage, `F#` a figure, table or equation (IP-030).
const EVIDENCE_GROUP = /\[\s*([EF]\d+(?:\s*[,;]\s*[EF]\d+)*)\s*\]/gi;

/** `e03` → `E3`. */
export const normalizeLabel = (raw: string): string => `${raw.charAt(0).toUpperCase()}${Number(raw.slice(1))}`;

/**
 * How a label reads on its chip: a passage by its number ("3"), a figure with its series ("F2"), so `E1` and
 * `F1` never look the same.
 */
export const chipText = (label: string): string => (label.charAt(0).toUpperCase() === 'E' ? label.slice(1) : label);

/** Labels in reading order: passages, then figures, each by number. */
export const compareLabels = (a: string, b: string): number =>
  a.charAt(0) === b.charAt(0) ? Number(a.slice(1)) - Number(b.slice(1)) : a.charAt(0) < b.charAt(0) ? -1 : 1;

/**
 * Evidence labels (IP-024) → `[3](#efv-evidence-E3)` per label the answer's citations resolve; a label they
 * lack (the `unknown` ones) stays plain text. While the answer streams (`pending`) not every citation is in yet,
 * so every label becomes a link; the renderer shows the unresolved ones as inert chips.
 */
export const evidenceToLinks = (text: string, citations: IAssistantCitation[], pending = false): string => {
  const known = new Set(citations.map((c) => c.label.toUpperCase()));
  return text.replace(EVIDENCE_GROUP, (group, list: string) => {
    const labels = list.split(/\s*[,;]\s*/).map(normalizeLabel);
    const link = (label: string) => `[${chipText(label)}](#efv-evidence-${label})`;
    if (pending) return labels.map(link).join('');
    if (!labels.some((label) => known.has(label))) return group;
    return labels.map((label) => (known.has(label) ? link(label) : `\\[${label}\\]`)).join('');
  });
};

/** The citation behind an evidence label, e.g. `E3` or `F2`. */
export const findCitation = (citations: IAssistantCitation[] | undefined, label: string) =>
  citations?.find((c) => c.label.toUpperCase() === label.toUpperCase());

/** A figure, table or equation (`F#`), rather than a passage. */
export const isFigure = (citation: IAssistantCitation): boolean =>
  citation.label.toUpperCase().startsWith('F') || !!citation.region_id;

/**
 * Markdown split into its blocks at blank lines, never inside a fenced code block, so figure cards can go under
 * the paragraph that cites them (IP-030 Phase 3). Joined with blank lines the blocks are the text again.
 */
export const markdownBlocks = (text: string): string[] => {
  const blocks: string[] = [];
  let current: string[] = [];
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (!fenced && !line.trim()) {
      if (current.length) blocks.push(current.join('\n'));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join('\n'));
  return blocks;
};

/** Figure labels (`F#`) a piece of text cites, each once, in order of first appearance. */
export const figureLabelsIn = (text: string): string[] => {
  const found: string[] = [];
  for (const match of text.matchAll(EVIDENCE_GROUP)) {
    for (const raw of match[1].split(/\s*[,;]\s*/)) {
      const label = normalizeLabel(raw);
      if (label.startsWith('F') && !found.includes(label)) found.push(label);
    }
  }
  return found;
};

/** Merges citations by label; a later one (the authoritative `citations` frame) replaces an earlier one. */
export const mergeCitations = (
  current: IAssistantCitation[] | undefined,
  incoming: IAssistantCitation[],
): IAssistantCitation[] => {
  const byLabel = new Map((current ?? []).map((c) => [c.label.toUpperCase(), c]));
  incoming.forEach((c) => byLabel.set(c.label.toUpperCase(), { ...byLabel.get(c.label.toUpperCase()), ...c }));
  return [...byLabel.values()];
};
