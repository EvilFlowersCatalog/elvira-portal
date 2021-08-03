export interface ListEntriesResponse {
  items: ListEntriesItem[];
  metadata: ListEntriesMetadata;
}

export interface ListEntriesItem {
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
}

export interface ListEntriesMetadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}
