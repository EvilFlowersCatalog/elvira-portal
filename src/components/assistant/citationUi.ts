import useAuthContext from '../../hooks/contexts/useAuthContext';
import { withAccessToken } from '../../utils/func/functions';
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
