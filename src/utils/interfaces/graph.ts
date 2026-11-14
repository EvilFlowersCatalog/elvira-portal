// Library graph (IP-030, EvilFlowersCatalog#152). Everything is already filtered to what the
// caller may read; an empty response means the graph is off or not filled yet.

export interface ILibraryMapNode {
  id: string;
  catalog_id: string;
  title: string;
  /** Category terms — UDC codes in the STU catalogs ("004", "314"). */
  udc: string[];
  pages: number | null;
}

export interface ILibraryMapEdge {
  source: string;
  target: string;
  /** Cosine of the two publication vectors after the mean is subtracted (mutual 4-NN). */
  score: number;
}

export interface ILibraryMap {
  nodes: ILibraryMapNode[];
  edges: ILibraryMapEdge[];
}

export interface IChapter {
  /** For `/api/v1/sections/{key}/…`. */
  key: string;
  seq: number;
  /** Null where the reader may not read the text here (Readium LCP, outside the IP ranges). */
  title: string | null;
  /** Pages of the original PDF, 1-based. */
  first_page: number;
  last_page: number;
  paragraphs: number;
  /** False for front and back matter (contents, index, references …). */
  topical: boolean;
}

export interface IChapterLink {
  source: string;
  target: string;
  /** `similar` paragraph links between the two sections (≥ 2). */
  links: number;
}

export interface IChapterMap {
  entry_id: string;
  sections: IChapter[];
  links: IChapterLink[];
}

export interface IGraphSection {
  key: string;
  entry_id: string;
  title: string | null;
  first_page: number | null;
  score: number;
}

export interface IRelatedSection extends IGraphSection {
  via: 'concepts' | 'similar' | 'concepts+similar' | string;
}

export interface IPrerequisite extends IGraphSection {
  /** A section further on in the same book: "defined later in this book", not "read first". */
  later: boolean;
}
