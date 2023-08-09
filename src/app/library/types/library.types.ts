export interface ListEntriesResponse {
  items: EntriesItem[];
  metadata: Metadata;
}

export interface EntriesItem {
  id: string;
  author: EntryAuthor;
  language: EntryLanguage;
  title: string;
  created_at: string;
  updated_at: string;
  thumbnail: string;
  creator_id: string;
  catalog_id: string;
  category: EntryCategory;
}

export interface AcquisitionDetail {
  response: {
    relation: string;
    mime: string;
    url: string;
    id: string;
    content: string;
  };
}

export interface EntryDetail {
  response: {
    id: string;
    creator_id: string;
    catalog_id: string;
    author: EntryAuthor;
    contributors: EntryAuthor[];
    category: EntryCategory;
    feeds: [
      {
        catalog_id: string;
        children: string[];
        content: string;
        created_at: string;
        creator_id: string;
        id: string;
        kind: string;
        parents: string[];
        per_page: number;
        title: string;
        updated_at: string;
        url: string;
        url_name: string;
      }
    ];
    language: EntryLanguage;
    title: string;
    created_at: string;
    updated_at: string;
    summary: string;
    content: string;
    identifiers: string;
    acquisitions: [
      {
        relation: string;
        mime: string;
        url: string;
        id: string;
        content: string;
      }
    ];
    img: string;
  };
}

export interface EntryAuthor {
  id: string;
  name: string;
  surname: string;
}

export interface EntryLanguage {
  id: string;
  name: string;
  code: string;
}

export interface EntryCategory {
  id: string;
  term: string;
}

export interface EntriesParams {
  search: string;
  feed: string;
  page: number;
  limit: number;
}

export interface UserResponse {
  response: {
    id: string;
    username: string;
    name: string;
    surname: string;
    is_superuser: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }
}

export interface Authors {
  items: Author[];
  metadata: Metadata;
}

export interface Author {
  id: string;
  name: string;
  surname: string;
  catalog_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListFeedsResponse {
  items: FeedTreeNode[];
  metadata: Metadata;
}

export interface FeedTreeNode {
  id: string;
  title: string;
  children?: string[];
  kind: string;
  parents?: string[];
}

export interface FeedDetailRespone {
  response: {
    id: string;
    title: string;
    children?: string[];
    kind: string;
    parents?: string[];
  }
}

export interface Metadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

export interface userAcquisitionCreation {
  acquisition_id: string;
  type: string;
}

export interface UserAcquisitionCreationResponse {
  response: {
    id: string;
  }
}

export interface DownloadUserAcquistionWithQuery {
  response: {
    data: string;
  }
}
