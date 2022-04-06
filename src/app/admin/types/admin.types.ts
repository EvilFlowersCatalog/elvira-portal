export interface AdminResponse {}

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
  acquisitions: AcquisitionsItems[];
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

export interface AllEntryItems {
  id: string;
  creator_id: string;
  catalog_id: string;
  author: string;
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
}

export interface GetFeeds {
  items: AllFeedsItems[];
  metadata: {
    page: number;
    limit: number;
    pages: number;
    total: number;
  };
}

export interface AllFeedsItems {
  id: string;
  catalog_id: string;
  parent_id: string;
  creator_id: string;
  title: string;
  kind: string;
  url_name: string;
  url: string;
  content: string;
  per_page: number;
  created_at: string;
  updated_at: string;
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
