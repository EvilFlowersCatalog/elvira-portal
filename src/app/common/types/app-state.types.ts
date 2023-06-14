export interface State {
  isLoggedIn: boolean;
  token: string;
  refresh_token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
  theme: string;
  lang: string;
  sidebar: boolean;
  showSidebarToggle: boolean;
  sidenav: boolean;
  googleAuthed: boolean;
  filters: Filters;
}

export interface Filters {
  search: string;
  author: AuthorFilter;
  feed: string;
}

export interface AuthorFilter {
  name: string;
  id: string;
}
