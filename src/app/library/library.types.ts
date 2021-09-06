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
