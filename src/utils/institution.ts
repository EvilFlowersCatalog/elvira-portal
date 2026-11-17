import { config } from '@/lib/config';

/**
 * The institution a build serves (`ELVIRA_THEME`): its website, name, short name (licence terms) and the
 * e-mail domain of its accounts (profile, Gravatar), shown with its logo (`/assets/<theme>/stu/logo-*.png`)
 * on the sign-in page.
 */
interface Institution {
  url: string;
  name: string;
  short: string;
  /** Accounts are `<username>@<emailDomain>` (LDAP); the catalog's user has no e-mail field. */
  emailDomain: string;
}

const INSTITUTIONS: Record<'stu' | 'ku', Institution> = {
  stu: { url: 'https://www.stuba.sk/', name: 'Slovenská technická univerzita v Bratislave', short: 'STU', emailDomain: 'stuba.sk' },
  // KU's directory domain is unconfirmed (deployment issue in knowledge); ku.sk is the university's.
  ku: { url: 'https://www.ku.sk/', name: 'Katolícka univerzita v Ružomberku', short: 'KU', emailDomain: 'ku.sk' },
};

/** The institution of this deployment: KU, or STU (the default theme). */
export const institution: Institution = INSTITUTIONS[config.ELVIRA_THEME === 'ku' ? 'ku' : 'stu'];

/** The account's e-mail: the username itself when it is one, else `<username>@<institution domain>`. */
export const userEmail = (username: string | undefined | null): string | null => {
  if (!username) return null;
  if (username.includes('@')) return username;
  return `${username}@${institution.emailDomain}`;
};
