import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';

/**
 * The portal map the assistant guides with: every place it can take the reader to and the element it lights
 * up there. The assistant (`navigate` frame) and the portal's own matcher name targets by id only — never a URL
 * or a selector — so nothing the model writes reaches the router or the DOM unchecked.
 *
 * Anchors are `data-guide="<anchor>"` attributes on the elements themselves.
 */

export type GuideGate = 'auth' | 'admin' | 'experimental';

export type GuideSection = 'menu' | 'reader' | 'personal' | 'admin';

export interface GuideTarget {
  id: string;
  section: GuideSection;
  /** Route the anchor lives on; none for the app chrome (sidebar, launcher), which is on every page. */
  path?: string;
  /** `data-guide` value of the element to spotlight. */
  anchor: string;
  /** The menu entry that leads here, shown first so the reader learns the way (a "show me" of a page). */
  via?: string;
  gates?: GuideGate[];
  /** Normalized stems (lowercase, no diacritics) in Slovak and English. Longer stems weigh more. */
  keywords?: string[];
}

export interface GuideTour {
  id: string;
  targets: string[];
  gates?: GuideGate[];
}

/** One spotlight of a running guide, with its text resolved. */
export interface GuideStep {
  key: string;
  path?: string;
  anchor: string;
  title: string;
  body: string;
  /** The anchor is in the sidebar, which a small screen has to open first. */
  menu: boolean;
}

/** What a chat message offers: a "show me" of one or more targets, or a named tour. */
export interface GuideRequest {
  targets: string[];
  tour?: string;
}

const ADMIN_PAGES: { key: string; path: NAVIGATION_PATHS; keywords: string[] }[] = [
  { key: 'dashboard', path: NAVIGATION_PATHS.adminHome, keywords: ['dashboard', 'prehlad', 'nastenk', 'statistik', 'statistics'] },
  { key: 'publications', path: NAVIGATION_PATHS.adminEntries, keywords: ['publikaci', 'publication', 'zaznam', 'entries', 'titul'] },
  { key: 'collections', path: NAVIGATION_PATHS.adminFeeds, keywords: ['kolekci', 'collection', 'feed'] },
  { key: 'categories', path: NAVIGATION_PATHS.adminCategories, keywords: ['kategori', 'categor', 'taxonom'] },
  { key: 'authors', path: NAVIGATION_PATHS.adminAuthors, keywords: ['autor', 'author'] },
  { key: 'reviews', path: NAVIGATION_PATHS.adminReviews, keywords: ['recenzi', 'hodnoten', 'review', 'rating'] },
  { key: 'catalogs', path: NAVIGATION_PATHS.adminCatalogs, keywords: ['katalog', 'catalog'] },
  { key: 'users', path: NAVIGATION_PATHS.adminUsers, keywords: ['pouzivatel', 'user', 'citatel', 'account', 'ucet', 'ucty'] },
  { key: 'access', path: NAVIGATION_PATHS.adminAccess, keywords: ['pristup', 'opravnen', 'access', 'permission', 'api kluc', 'api key', 'grant'] },
  { key: 'loans', path: NAVIGATION_PATHS.adminLoans, keywords: ['vypozic', 'loan', 'rezervaci', 'reservation', 'cirkulaci', 'circulation'] },
  { key: 'jobs', path: NAVIGATION_PATHS.adminJobs, keywords: ['uloh', 'job', 'ocr', 'sifrovan', 'encrypt', 'extrakci', 'extraction', 'spracovan', 'queue', 'front'] },
];

export const GUIDE_TARGETS: GuideTarget[] = [
  // ── The sidebar ─────────────────────────────────────────────────────────────
  { id: 'menu-home', section: 'menu', anchor: 'nav-home', gates: ['auth'] },
  { id: 'menu-library', section: 'menu', anchor: 'nav-library', gates: ['auth'] },
  { id: 'menu-feeds', section: 'menu', anchor: 'nav-feeds', gates: ['auth'] },
  { id: 'menu-categories', section: 'menu', anchor: 'nav-categories', gates: ['auth'] },
  { id: 'menu-ai', section: 'menu', anchor: 'nav-ai', gates: ['auth'] },
  { id: 'menu-admin', section: 'menu', anchor: 'nav-admin', gates: ['auth', 'admin'] },
  { id: 'menu-shelf', section: 'menu', anchor: 'nav-shelf', gates: ['auth'] },
  { id: 'menu-history', section: 'menu', anchor: 'nav-history', gates: ['auth'] },
  { id: 'menu-loans', section: 'menu', anchor: 'nav-loans', gates: ['auth'] },
  { id: 'menu-profile', section: 'menu', anchor: 'nav-profile', gates: ['auth'] },
  {
    id: 'menu-language',
    section: 'menu',
    anchor: 'nav-language',
    keywords: ['jazyk', 'language', 'anglictin', 'english', 'slovencin', 'slovak', 'prelozit', 'translate'],
  },
  {
    id: 'menu-theme',
    section: 'menu',
    anchor: 'nav-theme',
    keywords: ['tmavy', 'svetly', 'dark mode', 'light mode', 'night mode', 'nocny rezim', 'theme', 'vzhlad'],
  },
  { id: 'menu-help', section: 'menu', anchor: 'nav-help', gates: ['experimental'], keywords: ['pomoc', 'navod', 'help', 'manual', 'faq'] },
  { id: 'assistant-launcher', section: 'menu', anchor: 'assistant-launcher', gates: ['auth'] },

  // ── Reading ─────────────────────────────────────────────────────────────────
  { id: 'home', section: 'reader', path: NAVIGATION_PATHS.home, anchor: 'home-search', via: 'nav-home', gates: ['auth'], keywords: ['domov', 'uvod', 'home', 'start'] },
  { id: 'home-ai', section: 'reader', path: NAVIGATION_PATHS.home, anchor: 'home-ai-banner', gates: ['auth'] },
  {
    id: 'library',
    section: 'reader',
    path: NAVIGATION_PATHS.library,
    anchor: 'page-title',
    via: 'nav-library',
    gates: ['auth'],
    keywords: ['kniznic', 'library', 'vsetky knihy', 'all books', 'katalog knih', 'browse'],
  },
  {
    id: 'search',
    section: 'reader',
    path: NAVIGATION_PATHS.library,
    anchor: 'search',
    gates: ['auth'],
    keywords: ['vyhlad', 'hlada', 'search', 'najst knihu', 'find a book', 'find book'],
  },
  {
    id: 'advanced-search',
    section: 'reader',
    path: NAVIGATION_PATHS.library,
    anchor: 'advanced-search',
    gates: ['auth'],
    keywords: ['filtr', 'filter', 'rozsiren', 'advanced', 'podla autora', 'by author', 'podla roku', 'by year'],
  },
  { id: 'sort', section: 'reader', path: NAVIGATION_PATHS.library, anchor: 'sort', gates: ['auth'], keywords: ['zorad', 'triedit', 'sort', 'order by', 'najnovs', 'newest', 'popular'] },
  {
    id: 'book',
    section: 'reader',
    path: NAVIGATION_PATHS.library,
    anchor: 'entry-card',
    gates: ['auth'],
    keywords: ['pozicat', 'pozicia', 'borrow', 'citat knihu', 'read a book', 'otvorit knihu', 'open a book', 'detail knihy', 'book detail'],
  },
  { id: 'feeds', section: 'reader', path: NAVIGATION_PATHS.feeds, anchor: 'page-title', via: 'nav-feeds', gates: ['auth'], keywords: ['kolekci', 'collection', 'feed', 'zbierk'] },
  { id: 'categories', section: 'reader', path: NAVIGATION_PATHS.categories, anchor: 'page-title', via: 'nav-categories', gates: ['auth'], keywords: ['kategori', 'categor', 'oblast', 'odbor', 'subject', 'temat'] },
  {
    id: 'ai-chats',
    section: 'reader',
    path: NAVIGATION_PATHS.aiChatHistory,
    anchor: 'page-title',
    via: 'nav-ai',
    gates: ['auth'],
    keywords: ['konverzac', 'chat history', 'historia chat', 'predosle chat', 'previous chat', 'my chats', 'moje chat'],
  },

  // ── Personal ────────────────────────────────────────────────────────────────
  { id: 'shelf', section: 'personal', path: NAVIGATION_PATHS.shelf, anchor: 'page-title', via: 'nav-shelf', gates: ['auth'], keywords: ['polic', 'shelf', 'ulozen', 'saved', 'oblub', 'favourite', 'favorite', 'bookmark', 'zalozk'] },
  { id: 'history', section: 'personal', path: NAVIGATION_PATHS.history, anchor: 'page-title', via: 'nav-history', gates: ['auth'], keywords: ['moja histori', 'mojej histori', 'histori citan', 'my history', 'reading history', 'naposledy', 'nedavno otvor', 'recently', 'read before'] },
  {
    id: 'loans',
    section: 'personal',
    path: NAVIGATION_PATHS.loans,
    anchor: 'page-title',
    via: 'nav-loans',
    gates: ['auth'],
    keywords: ['vypozic', 'moje pozic', 'loan', 'borrowed', 'rezervaci', 'reservation', 'vratit', 'return', 'licenci', 'license'],
  },
  { id: 'profile', section: 'personal', path: NAVIGATION_PATHS.profile, anchor: 'page-title', via: 'nav-profile', gates: ['auth'], keywords: ['profil', 'profile', 'moj ucet', 'my account', 'account'] },
  {
    id: 'passphrase',
    section: 'personal',
    path: NAVIGATION_PATHS.profile,
    anchor: 'profile-passphrase',
    gates: ['auth'],
    // Not "password": the sign-in password is the university's, the portal only keeps the reading passphrase.
    keywords: ['fraz', 'passphrase', 'thorium', 'lcp', 'drm', 'odomkn', 'unlock'],
  },
  {
    id: 'notifications',
    section: 'personal',
    path: NAVIGATION_PATHS.profile,
    anchor: 'profile-notifications',
    gates: ['auth'],
    keywords: ['notifikac', 'upozornen', 'notification', 'e-mail', 'email', 'mail'],
  },

  // ── Administration ──────────────────────────────────────────────────────────
  ...ADMIN_PAGES.map<GuideTarget>(({ key, path, keywords }) => ({
    id: `admin-${key}`,
    section: 'admin',
    path,
    anchor: 'page-title',
    via: `admin-nav-${key}`,
    gates: ['auth', 'admin'],
    keywords,
  })),
  ...ADMIN_PAGES.map<GuideTarget>(({ key }) => ({
    id: `admin-menu-${key}`,
    section: 'admin',
    path: NAVIGATION_PATHS.adminHome,
    anchor: `admin-nav-${key}`,
    gates: ['auth', 'admin'],
  })),
  { id: 'admin-attention', section: 'admin', path: NAVIGATION_PATHS.adminHome, anchor: 'admin-attention', gates: ['auth', 'admin'], keywords: ['pozornost', 'problem', 'attention', 'issue', 'chyby', 'error'] },
  {
    id: 'admin-add-entry',
    section: 'admin',
    path: NAVIGATION_PATHS.adminEntries,
    anchor: 'page-actions',
    gates: ['auth', 'admin'],
    keywords: [
      'pridat publikaci', 'pridam publikaci', 'pridat knih', 'pridam knih', 'nahrat', 'nahram', 'novu publikaci', 'nova publikaci',
      'add a publication', 'add publication', 'add a book', 'upload', 'new publication',
    ],
  },
  {
    id: 'admin-add-user',
    section: 'admin',
    path: NAVIGATION_PATHS.adminUsers,
    anchor: 'page-actions',
    gates: ['auth', 'admin'],
    keywords: [
      'pridat pouzivatel', 'pridam pouzivatel', 'novy pouzivatel', 'noveho pouzivatel', 'vytvorit pouzivatel', 'vytvorim pouzivatel',
      'zalozit ucet', 'zalozim ucet', 'add a user', 'add user', 'new user', 'create user', 'create an account',
    ],
  },
];

export const GUIDE_TOURS: GuideTour[] = [
  {
    id: 'portal',
    targets: [
      'home',
      'home-ai',
      'menu-library',
      'menu-feeds',
      'menu-categories',
      'menu-shelf',
      'menu-history',
      'menu-loans',
      'menu-ai',
      'menu-profile',
      'menu-language',
      'menu-theme',
      'assistant-launcher',
    ],
    gates: ['auth'],
  },
  { id: 'find-book', targets: ['search', 'advanced-search', 'sort', 'book'], gates: ['auth'] },
  { id: 'account', targets: ['profile', 'passphrase', 'notifications', 'menu-language', 'menu-theme'], gates: ['auth'] },
  {
    id: 'admin',
    targets: ['admin-dashboard', 'admin-attention', ...ADMIN_PAGES.filter((p) => p.key !== 'dashboard').map((p) => `admin-menu-${p.key}`)],
    gates: ['auth', 'admin'],
  },
];

const TARGETS = new Map(GUIDE_TARGETS.map((target) => [target.id, target]));
const TOURS = new Map(GUIDE_TOURS.map((tour) => [tour.id, tour]));

export interface GuideAccess {
  authenticated: boolean;
  admin: boolean;
}

const experimental = import.meta.env.ELVIRA_EXPERIMENTAL_FEATURES === 'true';

const allowed = (gates: GuideGate[] | undefined, access: GuideAccess) =>
  (gates ?? []).every((gate) =>
    gate === 'auth' ? access.authenticated : gate === 'admin' ? access.admin : experimental,
  );

export const guideTarget = (id: string, access: GuideAccess): GuideTarget | undefined => {
  const target = TARGETS.get(id);
  return target && allowed(target.gates, access) ? target : undefined;
};

export const guideTour = (id: string, access: GuideAccess): GuideTour | undefined => {
  const tour = TOURS.get(id);
  return tour && allowed(tour.gates, access) ? tour : undefined;
};

/** The anchors a target's menu entry sits under, so its label can read "Administration › Users". */
const adminKeyOf = (anchor: string) => (anchor.startsWith('admin-nav-') ? anchor.slice('admin-nav-'.length) : null);
/** In the sidebar, which a small screen opens as a drawer (the launcher floats over the page instead). */
const isMenuAnchor = (anchor: string) => anchor.startsWith('nav-');

/** Keeps a request to the targets and tour this reader may see; null when nothing is left. */
export const sanitizeGuide = (request: GuideRequest, access: GuideAccess): GuideRequest | null => {
  const tour = request.tour && guideTour(request.tour, access) ? request.tour : undefined;
  const targets = [...new Set(request.targets)].filter((id) => guideTarget(id, access)).slice(0, 6);
  return tour || targets.length ? { targets, ...(tour ? { tour } : {}) } : null;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The title the reader sees for a target (a menu entry reads as its label). */
export const targetTitle = (id: string, t: Translate) => t(`guide.t.${id}.title`);

/**
 * Turns a request into spotlight steps. A single page target is a "show me": first its menu entry, then the
 * page — the reader learns the way, not only the place. A tour lists its targets as they are. Steps for an
 * admin menu entry while the reader is outside the administration first light up the way in.
 */
export const buildSteps = (
  request: GuideRequest,
  access: GuideAccess,
  pathname: string,
  t: Translate,
): GuideStep[] => {
  const tour = request.tour ? guideTour(request.tour, access) : undefined;
  const ids = tour ? tour.targets : request.targets;
  const withWay = !tour;
  const steps: GuideStep[] = [];
  let inAdmin = pathname.startsWith(NAVIGATION_PATHS.adminHome);

  const step = (key: string, anchor: string, title: string, body: string, path?: string) => {
    steps.push({ key, anchor, title, body, path, menu: isMenuAnchor(anchor) });
    if (path) inAdmin = path.startsWith(NAVIGATION_PATHS.adminHome);
  };

  for (const id of ids) {
    const target = guideTarget(id, access);
    if (!target) continue;
    const title = targetTitle(id, t);
    const body = t(`guide.t.${id}.body`);

    if (withWay && target.via) {
      const adminKey = adminKeyOf(target.via);
      if (adminKey) {
        if (!inAdmin) {
          step(`${id}:admin`, 'nav-admin', t('guide.t.menu-admin.title'), t('guide.way.admin', { label: title }));
        }
        step(`${id}:via`, target.via, title, t('guide.way.adminMenu', { label: title }), NAVIGATION_PATHS.adminHome);
      } else {
        step(`${id}:via`, target.via, title, t('guide.way.menu', { label: title }));
      }
    }
    step(id, target.anchor, title, body, target.path);
  }
  return steps;
};

// ── Recognising a "where is …" question without the model ────────────────────

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const NAV_INTENT =
  /\b(where|wheres|how (do|can|to|should)|show me|take me|go to|navigate|get to|find (the|my)|open (the|my)|walk me|guide me|kde|ako|ukaz|zobraz|prejd|otvor|chod|chcem ist|navigu|najdem|nastav|zmen|vrat|dostanem)/;

const TOUR_INTENT =
  /\b(tour|show me around|walk me through|how does (this|the portal|elvira) work|what can i do here|prehliad|ukaz mi portal|ukaz mi elviru|ako funguje (portal|elvira|tento portal)|co tu (viem|mozem|sa da)|sprievod)/;

const ADMIN_HINT = /\b(admin|spravc|sprav[ay]|administr|manage|spravovat)/;

/**
 * A question about the library's content ("books about the history of Rome", "knihy od autora X"): what follows
 * "about / o / od" is a topic, not a place in the portal, so it stays with the model.
 */
const CONTENT_QUESTION =
  /\b(knih|book|publikaci|publication|clank|article|tituly|titles|literatur|zdroj|sources?)\w*\b.*\b(o|about|on|od|by|from|na temu|tykajuc\w*|related to|regarding)\b/;

/**
 * The portal's own reading of a message: a navigation question that names a known place becomes a guide card
 * right away, while the assistant answers. Conservative on purpose — it needs both a "where / how do I" and a
 * place, so questions about the library's content ("where was Štúr born") stay with the model.
 */
export const matchGuide = (message: string, access: GuideAccess, pathname: string): GuideRequest | null => {
  const text = normalize(message);
  if (!text || text.length > 160) return null;

  const wantsAdmin = access.admin && (ADMIN_HINT.test(text) || pathname.startsWith(NAVIGATION_PATHS.adminHome));
  if (TOUR_INTENT.test(text)) {
    const tour = wantsAdmin ? 'admin' : /\b(profil|account|ucet)/.test(text) ? 'account' : 'portal';
    return sanitizeGuide({ targets: [], tour }, access);
  }
  if (!NAV_INTENT.test(text) || CONTENT_QUESTION.test(text)) return null;

  let best: { id: string; score: number } | null = null;
  for (const target of GUIDE_TARGETS) {
    if (!target.keywords || !guideTarget(target.id, access)) continue;
    const isAdmin = target.section === 'admin';
    const score = target.keywords.reduce((sum, keyword) => (text.includes(keyword) ? sum + keyword.length : sum), 0);
    // Where a reader page and its admin twin both match ("loans" → circulation), the context decides: the
    // administration, or a question that mentions it, prefers the admin one; anywhere else the reader's.
    const weighted = !score ? 0 : isAdmin === wantsAdmin ? score + 2 : score;
    if (weighted && (!best || weighted > best.score)) best = { id: target.id, score: weighted };
  }
  return best ? sanitizeGuide({ targets: [best.id] }, access) : null;
};

/** Where a target lives, for the guide card: "Menu › Personal › Loans". */
export const targetTrail = (id: string, t: Translate): string[] => {
  const target = TARGETS.get(id);
  if (!target) return [];
  const label = targetTitle(id, t);
  switch (target.section) {
    case 'menu':
      return [t('guide.section.menu'), label];
    case 'admin':
      return [t('guide.section.admin'), label];
    case 'personal':
      return [t('guide.section.personal'), label];
    default:
      return [t('guide.section.reader'), label];
  }
};
