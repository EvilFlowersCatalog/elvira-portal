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
  img: string;
  creator_id: string;
  catalog_id: string;
  category: EntryCategory;
}

export interface EntryDetail {
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
  authorId: string;
  feed: string;
  page: number;
  limit: number;
}

export interface UserResponse {
  aisId: number;
  email: string;
  firstName: string;
  lastName: string;
  googleAuthed: boolean;
  isAdmin: boolean;
  login: string;
  nick: string;
  role: string;
  _id: string;
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

export interface FeedTreeNode {
  id: string;
  title: string;
  updated: string;
  entry?: FeedTreeNode[];
  type: string;
}

export interface Metadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}
