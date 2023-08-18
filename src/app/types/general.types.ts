export interface State {
  isLoggedIn: boolean;
  token: string;
  refresh_token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
  theme: string;
  lang: string;
  sidenav: boolean;
}

export interface Metadata {
  page: number;
  limit: number;
  pages: number;
  total: number;
}

export interface DialogData {
  title: string;
  entryApikey: string;
  source: string;
}