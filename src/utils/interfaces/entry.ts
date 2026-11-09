import { IEntryAcquisition } from './acquisition';
import { IEntryAuthor } from './author';
import { ICategory } from './category';
import { IFeed } from './feed';
import { IConfig, IMetadata, LocalizedText } from './general/general';
import { ILanguage } from './language';
import { ExtractionEntryStatus } from './extraction';

export interface IEntriesList {
  items: IEntry[];
  metadata: IMetadata & {
    /** Set only when the request had `query` (null or absent otherwise). */
    search?: IEntrySearchMeta | null;
  };
  /** Only with `include=facets`. */
  facets?: IEntryFacets | null;
}

/** How the catalog answered a `query` (catalog IP-020 / IP-021). */
export interface IEntrySearchMeta {
  query: string;
  mode?: 'hybrid' | 'bm25' | 'fulltext' | 'semantic' | string;
  /** No entry matched exactly, so the results are related ones (see `fallback`). */
  relaxed: boolean;
  fallback?: 'any_word' | 'similar' | 'semantic' | null;
  /** A spelling correction, e.g. `Hirshberger` → `hirschberger`. */
  did_you_mean?: string | null;
  /** The embedding server didn't answer — words-only results. */
  degraded?: boolean;
  total?: number;
}

/** Why one entry matched a `query`. Highlights are server-escaped HTML whose only tag is `<mark>`. */
export interface IEntrySearchHit {
  score: number;
  matched: string[];
  highlights?: { title?: string | null; summary?: string | null } | null;
}

export type LcpState =
  | 'not_lcp'
  | 'available_now'
  | 'available_in_days'
  | 'active_loan_for_user'
  | 'fully_borrowed';

export interface IEntryLcpFields {
  lcp_state: LcpState;
  available_slots: number;
  total_slots: number;
  active_count: number;
  over_saturated: boolean;
  next_available_at: string | null;
  user_active_license_id: string | null;
  queue_length: number;
  user_reservation_id: string | null;
  user_position: number | null;
}

export interface IEntry extends Partial<IEntryLcpFields> {
  id: string;
  title: string;
  authors: IEntryAuthor[];
  language_code?: string;
  popularity: number;
  categories: ICategory[];
  acquisitions: IEntryAcquisition[];
  summary: string;
  feeds: IFeed[];
  creator_id: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
  /** AI processing (IP-018), only in lists fetched with `extraction: true`. */
  extraction_status?: ExtractionEntryStatus | null;
  extraction_regions?: number | null;
  extraction_paragraphs?: number | null;
  extraction_finished_at?: string | null;
  shelf_record_id: string;
  thumbnail: string;
  published_at?: string;
  /** Only in lists fetched with `query`. */
  search?: IEntrySearchHit;
}

/** One heading of the publication's outline; `page` is the viewer's page. */
export interface IEntryHeading {
  level: number;
  title: string;
  page: number;
}

export interface IEntryDetail extends Partial<IEntryLcpFields> {
  id: string;
  creator_id: string;
  catalog_id: string;
  authors: IEntryAuthor[];
  categories: ICategory[];
  popularity: string;
  feeds: IFeed[];
  language?: ILanguage;
  title: string;
  config: IConfig;
  published_at: string;
  publisher: string;
  created_at: string;
  updated_at: string;
  summary: string;
  content: string;
  identifiers: IEntryIdentifiers;
  acquisitions: IEntryAcquisition[];
  citation: string;
  shelf_record_id: string;
  thumbnail: string;
  page_count?: number | null;
  table_of_contents?: IEntryHeading[] | null;
}

export interface IEntryQuery {
  page: number;
  limit: number;
  title?: string;
  /** Single category ID — current production API (category_id) */
  categoryId?: string;
  /** Single feed ID — current production API (feed_id) */
  feedId?: string;
  /** Author name substring (`author`) — use `authorId` when the author is known. */
  authors?: string;
  /** Comma-separated author ids (`author_id`); wins over `authors`. */
  authorId?: string;
  publishedAtGte?: string;
  publishedAtLte?: string;
  orderBy?: string;
  query?: string;
  config__readium_enabled?: boolean;
  languageCode?: string;
  /** Comma-separated category IDs (OR-ed; sent as category_id together with categoryId) */
  categories?: string;
  /** Comma-separated feed IDs (OR-ed; sent as feed_id together with feedId) */
  feeds?: string;
  /** Comma-separated backend `lcp_state` values (see availabilityToLcpState) */
  lcpState?: string;
  /** Comma-separated entry IDs — restricts the result to these entries (e.g. the shelf) */
  ids?: string;
  /** Ask the catalog for the AI-processing columns (`extraction_*`) — admin list only. */
  extraction?: boolean;
  /** Comma-separated `extraction_status` values (unsupported, none, queued, running, done, failed, available). */
  extractionStatus?: string;
  /** `facets` adds the facet counts of the same filters to the list response. */
  include?: 'facets';
}

/**
 * `/entries/facets` or `include=facets`. Every dimension ignores its own filter
 * (disjunctive). A dimension not asked for with `facet=` comes back null.
 */
export interface IEntryFacets {
  languages?: { code: string; name?: string; count: number }[] | null;
  categories?: { id: string; term?: string; label?: LocalizedText | string; count: number }[] | null;
  feeds?: { id: string; title?: LocalizedText | string; count: number }[] | null;
  /** Top 10 by default */
  authors?: { id: string; name: string; surname: string; count: number }[] | null;
  publishers?: { value: string; count: number }[] | null;
  formats?: { mime: string; count: number }[] | null;
  fulltext?: { value: boolean; count: number }[] | null;
  /** Counts per backend `lcp_state` value plus the `reserved` pseudo-state */
  availability?: { state: string; count: number }[] | null;
  years?: { min: number | null; max: number | null } | null;
}

/** `GET /entries/suggest` — the type-ahead in one request. */
export interface IEntrySuggestions {
  query: string;
  entries: {
    id: string;
    catalog_id: string;
    title: string;
    authors: string[];
    thumbnail: string | null;
    highlight?: string | null;
  }[];
  authors: { id: string; name: string; surname: string; count: number }[];
  categories: { id: string; term: string; label?: LocalizedText | string; count: number }[];
  feeds: { id: string; title: LocalizedText | string; count: number }[];
  did_you_mean?: string | null;
}

export interface IEntryNew {
  title: string;
  authors: IEntryAuthor[];
  feeds: string[];
  summary: string;
  language_code?: string;
  identifiers: IEntryIdentifiers;
  categories: ICategory[];
  config?: IConfig;
  citation: string;
  published_at?: string;
  publisher: string;
  image?: any;
}

export interface IEntryNewForm {
  title: string;
  authors: IEntryAuthor[];
  feeds: {
    id: string;
    title: string;
  }[];
  categories: ICategory[];
  summary: string;
  language_code?: string;
  identifiers: IEntryIdentifiers;
  config?: IConfig;
  citation?: string;
  published_at: string;
  publisher: string;
  thumbnail?: string;
}

export interface IEntryIdentifiers {
  doi: string;
  isbn: string;
}

export interface IEntryInfo {
  title: string;
  publisher: string;
  doi: string;
  authors: IEntryAuthor[];
  year: string;
  language: string;
  bibtex: string;
}
