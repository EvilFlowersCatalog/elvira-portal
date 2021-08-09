export interface ListEntriesResponse {
  items: EntriesItem[];
  metadata: ListEntriesMetadata;
}

export interface EntriesItem {
  id: string;
  creator_id: string;
  catalog_id: string;
  author: {
    id: string;
    name: string;
    surname: string;
  };
  category: {
    id: string;
    term: string;
  };
  language: {
    id: string;
    name: string;
    code: string;
  };
  title: string;
  created_at: string;
  updated_at: string;
  img: string;
}

export interface ListEntriesMetadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}
