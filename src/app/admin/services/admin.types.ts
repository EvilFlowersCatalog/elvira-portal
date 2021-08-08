export interface AdminResponse {
  };

export interface EntriesData {
  title: string;
  author: {
    name: string;
    surname: string;
  };
  contributors: EntriesContributors[];
  summary: string;
  language_code: string;
  acquisitions: {
    content: unknown;
  }
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
  }
}

export interface AllEntryItems {
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
  updated_at: string
}

export interface DialogData {
  title: string;
  entryApikey: string;
}

export interface EditedData {
  title: string;
  author: {
    name: string;
    surname: string;
  };
  summary: string;
  language_code: string;
}
