import useAuthContext from '../../hooks/contexts/useAuthContext';
import { withAccessToken } from '../../utils/func/functions';
import { citePath } from '../../utils/func/citeLink';
import { IAssistantCitation, IChatContext } from '../../utils/interfaces/assistant';

/** The look of every citation chip in an answer: evidence labels, page and region citations. */
export const citeClass =
  'inline-flex items-center px-1.5 py-px mx-0.5 rounded-md text-xs font-medium align-baseline bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 no-underline enabled:hover:underline enabled:hover:bg-sky-500/20 dark:enabled:hover:bg-sky-400/25 disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500';

/** A figure crop as an <img> can load it (the region image endpoint wants the token). */
export const useCropUrl = () => {
  const { auth } = useAuthContext();
  return (url?: string | null) => (url ? withAccessToken(url, auth?.token) : undefined);
};

const REGION_KINDS = ['figure', 'table', 'equation'] as const;
export type RegionKind = (typeof REGION_KINDS)[number];

export const regionKind = (citation: IAssistantCitation): RegionKind =>
  REGION_KINDS.includes(citation.kind as RegionKind) ? (citation.kind as RegionKind) : 'figure';

/**
 * How a figure is named: its printed label ("Table 8.1") when the catalog sent one, else its kind ("Table"). The
 * printed label wins because the extractor's kind is sometimes wrong (a table detected as a figure).
 */
export const figureName = (citation: IAssistantCitation, t: (key: string) => string): string =>
  citation.printed_label?.trim().slice(0, 40) || t(`assistant.region.${regionKind(citation)}`);

/** Whether a cited region has extracted data worth a "data" view: a table's cells or an equation's LaTeX. */
export const hasRegionData = (citation: IAssistantCitation): boolean =>
  (typeof citation.markdown === 'string' && citation.markdown.includes('|')) ||
  (typeof citation.latex === 'string' && !!citation.latex.trim());

/**
 * A shareable link to the cited unit: the portal's own `/cite` route when the citation has a locator (it survives
 * re-extraction, elvira-portal#46), else the catalog's `url`.
 */
export const figureLink = (citation: IAssistantCitation): string | undefined => {
  if (citation.locator_key) return `${window.location.origin}${citePath(citation.entry_id, citation.locator_key)}`;
  return citation.url && /^https?:\/\//.test(citation.url) ? citation.url : undefined;
};

/** A cited figure as a chat attachment — the shape the viewer sends for "ask about this region". */
export const figureContext = (citation: IAssistantCitation): IChatContext | null =>
  citation.region_id && citation.page
    ? {
        kind: 'region',
        region: {
          id: citation.region_id,
          kind: regionKind(citation),
          page: citation.page,
          bbox: citation.bbox ?? { x0: 0, y0: 0, x1: 1, y1: 1 },
          caption: citation.caption ?? null,
          imageUrl: citation.image_url ?? null,
        },
      }
    : null;
