// Extraction locators (EvilFlowersCatalog#171): run-independent addresses for paragraphs, regions and sections,
// so a citation link survives re-extraction. Contract: docs/citation-links.md.

import type { IAssistantBox } from './assistant';

/** How the catalog found the passage: the same key in the active run, a quote match nearby, or only the page. */
export type LocatorResolution = 'exact' | 'relocated' | 'page_only';

export interface ILocator {
  key: string;
  entry_id: string;
  /** `paragraph`, `section`, `figure`, `table` or `equation`. */
  kind: string;
  /** 1-based page in the reader's numbering (licence page of an LCP copy included). */
  page: number;
  /** Page of the original PDF. */
  source_page?: number;
  /** The paragraph (or region) box, fractions of the page, origin top-left. */
  bbox?: IAssistantBox | null;
  /** The best sentence's line boxes. */
  quads?: IAssistantBox[] | null;
  /** The page the `quads` are on, when it is not `page`. */
  quads_page?: number | null;
  resolution: LocatorResolution;
  /** The quoted text, only where the reader may read it. */
  quote?: string | null;
  /** Answered instead of a position when the caller may not read the publication (#46). */
  how_to_unlock?: unknown;
  entry?: { id: string; catalog_id?: string; title?: string } | null;
}
