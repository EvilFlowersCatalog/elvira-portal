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

export enum IdentifiersType {
  DOI = 'doi',
  ISBN = 'isbn',
}

export class Filters {
  title: string;
  author: string;
  feed: string;
  from: string = '';
  to: string = '';
  constructor(
    title: string = '',
    author: string = '',
    feed: string = '',
    from: string[] = [],
    to: string[] = []
  ) {
    this.title = title;
    this.author = author;
    this.feed = feed;
    for (let i = 0; i < from.length; i++) {
      if (from[i]) {
        if (i === 0) {
          this.from += from[i];
        } else {
          this.from += `-${from[i]}`;
        }
      }
    }
    for (let i = 0; i < to.length; i++) {
      if (to[i]) {
        if (i === 0) {
          this.to += to[i];
        } else {
          this.to += `-${to[i]}`;
        }
      }
    }
  }
  getFilters() {
    return `title=${this.title}&feed=${this.feed}&author=${this.author}&from=${this.from}&to=${this.to}`;
  }
  isActive() {
    if (this.title || this.author || this.feed || this.from || this.to)
      return true;
    return false;
  }
}
