export type CatalogAccessMode = 'read' | 'manage';

export interface IUserCatalog {
  mode: CatalogAccessMode;
  user: {
    id: string;
    username: string;
    name: string;
    surname: string;
  };
}

export interface ICatalog {
  id: string;
  creator_id: string;
  url_name: string;
  title: string;
  is_public: boolean;
  touched_at: string;
  created_at: string;
  updated_at: string;
  /** Present on the detail endpoint. */
  user_catalogs?: IUserCatalog[];
}

export interface ICatalogsList {
  items: ICatalog[];
}

/** Membership entry as accepted by POST/PUT /api/v1/catalogs. */
export interface ICatalogMemberInput {
  user_id: string;
  mode: CatalogAccessMode;
}

export interface ICatalogPayload {
  url_name: string;
  title: string;
  is_public: boolean;
  /** Full membership set — PUT replaces existing membership with this list. */
  users?: ICatalogMemberInput[];
}
