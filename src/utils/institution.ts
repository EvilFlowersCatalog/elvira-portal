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

const stu = (faculty: string, url: string): Institution => ({ url, name: `${faculty} STU`, short: 'STU', emailDomain: 'stuba.sk' });

const INSTITUTIONS: Record<string, Institution> = {
  stu: { url: 'https://www.stuba.sk/', name: 'Slovenská technická univerzita v Bratislave', short: 'STU', emailDomain: 'stuba.sk' },
  fiit: stu('FIIT', 'https://www.fiit.stuba.sk/'),
  mtf: stu('MTF', 'https://www.mtf.stuba.sk/'),
  fad: stu('FAD', 'https://www.fad.stuba.sk/'),
  fchpt: stu('FCHPT', 'https://www.fchpt.stuba.sk/'),
  fei: stu('FEI', 'https://www.fei.stuba.sk/'),
  sjf: stu('SjF', 'https://www.sjf.stuba.sk/'),
  svf: stu('SvF', 'https://www.svf.stuba.sk/'),
  // KU's directory domain is unconfirmed (deployment issue in knowledge); ku.sk is the university's.
  ku: { url: 'https://www.ku.sk/', name: 'Katolícka univerzita v Ružomberku', short: 'KU', emailDomain: 'ku.sk' },
};

/** The institution of this build; none for the neutral `default` theme. */
export const institution: Institution | null = INSTITUTIONS[import.meta.env.ELVIRA_THEME ?? ''] ?? null;

/** The account's e-mail: the username itself when it is one, else `<username>@<institution domain>`. */
export const userEmail = (username: string | undefined | null): string | null => {
  if (!username) return null;
  if (username.includes('@')) return username;
  return `${username}@${institution?.emailDomain ?? 'stuba.sk'}`;
};
