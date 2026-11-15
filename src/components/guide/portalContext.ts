import { NAVIGATION_PATHS } from '../../utils/interfaces/general/general';
import { GUIDE_TARGETS, GuideAccess, guideTarget } from './guideRegistry';

/**
 * What the reader is looking at, in the portal's own semantic vocabulary, sent with every assistant message as
 * `portal_context` (contract: docs/assistant-portal-context.md). Everything here comes from the guide registry —
 * ids the assistant can also name in a `navigate` frame — plus entity ids read from the URL. Nothing is scraped
 * from the page text, and nothing a reader may not see is described (the registry's gates apply).
 */

export interface IPortalPlace {
  /** Guide registry id, e.g. `loans`, `admin-jobs-processing` — valid `navigate` targets. */
  id: string;
  title: string;
  /** What the place is for, in the UI language (the guide's own explanation). */
  description: string;
}

export interface IPortalFocus {
  /** `entry`: a publication's detail, reader or admin record is open. */
  kind: 'entry';
  id: string;
  /** Where it is open. */
  view: 'detail' | 'reader' | 'admin';
}

export interface IPortalContext {
  /** Path with the query string that matters (an open detail, a tab), e.g. `/library?entry-detail-id=…`. */
  path: string;
  /** The page itself, when the registry knows it. */
  page?: IPortalPlace;
  /** Other known places on this page that are on screen now (a search box, a tab bar, a section). */
  places: IPortalPlace[];
  /** Entities the reader has open. */
  focus: IPortalFocus[];
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Query parameters worth the assistant's attention; the rest (sorting, paging) is noise. */
const KEPT_PARAMS = ['entry-detail-id', 'tab', 'query', 'q', 'state', 'category-id', 'feed-id'];
const MAX_PLACES = 12;

const place = (id: string, t: Translate): IPortalPlace => ({
  id,
  title: t(`guide.t.${id}.title`),
  description: t(`guide.t.${id}.body`),
});

const onScreen = (anchor: string): boolean =>
  typeof document !== 'undefined' && !!document.querySelector(`[data-guide="${CSS.escape(anchor)}"]`);

export const portalContext = (
  location: { pathname: string; search: string },
  access: GuideAccess,
  t: Translate,
): IPortalContext => {
  const { pathname } = location;
  const params = new URLSearchParams(location.search);
  const kept = new URLSearchParams();
  KEPT_PARAMS.forEach((key) => {
    const value = params.get(key);
    if (value) kept.set(key, value.slice(0, 120));
  });
  const query = kept.toString();

  const here = GUIDE_TARGETS.filter((target) => target.path === pathname && guideTarget(target.id, access));
  const pageTarget = here.find((target) => target.anchor === 'page-title') ?? here[0];
  const places = here
    .filter((target) => target !== pageTarget && onScreen(target.anchor))
    .slice(0, MAX_PLACES)
    .map((target) => place(target.id, t));

  const focus: IPortalFocus[] = [];
  const detailId = params.get('entry-detail-id');
  if (detailId) focus.push({ kind: 'entry', id: detailId, view: 'detail' });
  if (pathname.startsWith(NAVIGATION_PATHS.viewer)) {
    // `/viewer/<entry>/<file index>`; the reader's page travels separately (`page` in the message body).
    const entryId = pathname.slice(NAVIGATION_PATHS.viewer.length).split('/')[0];
    if (entryId) focus.push({ kind: 'entry', id: entryId, view: 'reader' });
  }
  if (pathname.startsWith(NAVIGATION_PATHS.adminEditEntries)) {
    const entryId = pathname.slice(NAVIGATION_PATHS.adminEditEntries.length).split('/')[0];
    if (entryId) focus.push({ kind: 'entry', id: entryId, view: 'admin' });
  }

  return {
    path: query ? `${pathname}?${query}` : pathname,
    ...(pageTarget ? { page: place(pageTarget.id, t) } : {}),
    places,
    focus,
  };
};
