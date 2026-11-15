// Extraction locators (EvilFlowersCatalog#171, catalog 05cf002): run-independent addresses of paragraphs,
// sections and figures, so a citation link survives re-extraction. `GET /api/v1/locators/{entry_id}/{key}`.

import type { IAssistantBox } from './assistant';

/** How the catalog found it: the key in the active run, its quote within two pages, or only its page. */
export type LocatorResolution = 'exact' | 'relocated' | 'page_only';

export interface ILocator {
  key: string;
  entry_id: string;
  /** `paragraph`, `section`, `figure`, `table` or `equation`. */
  kind: string;
  resolution: LocatorResolution;
  /** 1-based page in the viewer's numbering (the licence page of the reader's copy included). */
  page: number;
  /** Page of the original file. */
  source_page: number;
  /** The paragraph or region box, fractions of the page, origin top-left. */
  bbox?: IAssistantBox | null;
  /** The best sentence's line boxes (`?sentence=` picks it). */
  quads?: IAssistantBox[] | null;
  /** Whether the reader may read the text outside the viewer (never for Readium LCP or outside IP ranges). */
  readable: boolean;
  quote?: string | null;
  /** Set when the locator no longer matches the active run. */
  detached_at?: string | null;
  /** The same position as a Readium Locator. */
  readium?: { href: string | null; type: string; locations: Record<string, unknown>; text: Record<string, unknown> };
}
