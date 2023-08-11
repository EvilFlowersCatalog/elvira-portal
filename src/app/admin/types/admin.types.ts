import { EntryAuthor } from "src/app/library/types/library.types";

export interface AdminResponse {
  response: {
		id: string;
		username: string;
		name: string;
		surname: string;
		is_superuser: boolean;
		is_active: boolean;
		last_login: string;
		created_at: string;
		updated_at: string;
	}
}

export interface EntriesData {
  title: string;
  author: {
    name: string;
    surname: string;
  };
  feeds: string[];
  contributors: EntriesContributors[];
  summary: string;
  language_code: string;
  identifiers: {
		google: string;
		isbn: string;
	},
  image: any;
}

export interface AcquisitionsItems {
  relation: string;
  content: unknown;
}

export interface EntriesContributors {
  name: string;
  surname: string;
}

export interface GetEntries {
  items: AllEntryItems[];
  metadata: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
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

export interface EntryLanguage {
  id: string;
  name: string;
  code: string;
}

export interface EntryCategory {
  id: string;
  term: string;
}

export interface AllEntryItems {
  id: string;
  creator_id: string;
  catalog_id: string;
  author: EntryAuthor;
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

export interface OneEntryItem {
  response: {
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
    feeds: FeedsItems[];
    contributors: EntriesContributors[];
    summary: string;
    thumbnail: string;
  }
}

export interface FeedsItems {
  catalog_id: string;
  content: string;
  created_at: string;
  creator_id: string;
  id: string;
  kind: string;
  parents: string[];
  children: string[];
  title: string;
  updated_at: string;
}

export interface acquisitions {
  relation: string;
  mime: string;
}

export interface DialogData {
  title: string;
  entryApikey: string;
  source: string;
}

export interface EditedData {
  title: string;
  author: {
    name: string;
    surname: string;
  };
  feeds: string[];
  summary: string;
  language_code: string;
  contributors: EntriesContributors[];
  identifiers: {
		google: string;
		isbn: string;
	},
  image: any;
}

export interface Metadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

export interface FeedTreeNode {
  id: string;
  title: string;
  children?: string[];
  kind: string;
  parents?: string[];
  content: string;
}

export interface UpdateFeeds {
  catalog_id: string;
  title: string;
  url_name: string;
  content: string;
  kind: string;
}

export interface NewFeed {
  parents: string[];
  title: string;
  url_name: string;
  content: string;
  kind: string;
}
