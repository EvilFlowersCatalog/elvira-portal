export interface State {
  isLoggedIn: boolean;
  token: string;
  refresh_token: string;
  username: string;
  userId: string;
  isAdmin: boolean;
  theme: 'dark' | 'light';
  lang: string;
  sidenav: boolean;
  count: number;
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

export class Filters {
  title: string;
  author: string;
  feed: string;
  constructor(title: string = '', author: string = '', feed: string = '') {
    this.title = title;
    this.author = author;
    this.feed = feed;
  }
  getFilters() {
    return `title=${this.title}&feed=${this.feed}&author=${this.author}`;
  }
  isActive() {
    if (this.title || this.author || this.feed) return true;
    return false;
  }
}
