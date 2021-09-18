export interface ListEntriesResponse {
  items: EntriesItem[];
  metadata: Metadata;
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

export interface EntryDetail {
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
