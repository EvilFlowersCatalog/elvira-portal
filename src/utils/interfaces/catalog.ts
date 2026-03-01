export interface ICatalog {
  id: string;
  creator_id: string;
  url_name: string;
  title: string;
  is_public: boolean;
  touched_at: string;
  created_at: string;
  updated_at: string;
}

export interface ICatalogsList {
  items: ICatalog[];
}
