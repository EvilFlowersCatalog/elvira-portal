import { LoaderFunctionArgs, redirect, ShouldRevalidateFunctionArgs } from 'react-router-dom';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { queryClient } from '../lib/reactQuery';
import { readStoredAuth, isTokenFresh } from '../lib/session';
import { entryPath, loginPath, readerPath } from '../lib/links/paths';
import { entryDetailQuery, httpStatus } from '../hooks/api/entries/entryQueries';
import { readablePdfIndex } from '../hooks/useOpenPublication';
import { NAVIGATION_PATHS } from '../utils/interfaces/general/general';
import { IEntryDetail } from '../utils/interfaces/entry';
import { startReaderSession } from './readerSession';
import { loadViewer } from './pages';

/**
 * Route loaders. They never block on data a page can show progressively: the publication page only starts
 * its query (in parallel with its code chunk) and renders at once. The reader waits for the publication,
 * because which file to open, or whether to open the reader at all, depends on it; that answer is usually
 * already cached from the dialog the reader was opened from.
 *
 * Loaders run before any component, the auth guard's token refresh included. They therefore only call the
 * API with a stored access token that is still valid (`isTokenFresh`); with an expired one a request would
 * 401 and log the reader out, although the guard's refresh would have kept the session. Then the page does
 * the work itself once the guard has refreshed.
 */

const here = (request: Request) => {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}`;
};

/** A stored access token the API will accept: loaders may call it. */
const canCallApi = () => isTokenFresh(readStoredAuth()?.token);

/** `/entries/:entryId[/:tab]`: start loading the publication while the page's chunk downloads. */
export const entryLoader = ({ params, request }: LoaderFunctionArgs) => {
  const catalogId = new URL(request.url).searchParams.get('catalog');
  if (params.entryId && canCallApi()) void queryClient.prefetchQuery(entryDetailQuery(params.entryId, catalogId));
  return null;
};

export interface IReaderFile {
  /** Index of the file in `entry.acquisitions`. */
  fileIndex: number;
  acquisitionId: string;
}

export interface IReaderRouteData {
  entryId: string;
  catalogId: string | null;
  /** `file` from the address: an acquisition id, or null for the readable PDF. */
  file: string | null;
  /** The file, when the loader could resolve it; otherwise the reader resolves it (`resolveReaderFile`). */
  resolved: IReaderFile | null;
}

/** The file to read: the one named by `file` (an acquisition id), else the readable PDF; null when none. */
export const resolveReaderFile = (entry: IEntryDetail, file: string | null): IReaderFile | null => {
  const fileIndex = file ? entry.acquisitions.findIndex((a) => a.id === file) : readablePdfIndex(entry);
  if (fileIndex < 0) return null;
  // Readium LCP files are borrowed and read in a Readium app, never here.
  if (entry.config?.readium_enabled || entry.acquisitions[fileIndex].mime !== 'application/pdf') return null;
  return { fileIndex, acquisitionId: entry.acquisitions[fileIndex].id };
};

/** Not readable in the portal's reader: the publication page, where borrowing and the other files are. */
export const notReadableHere = () => toast.info(i18next.t('links.notReadable'), { toastId: 'not-readable' });

/**
 * `/entries/:entryId/read`: resolve the file, send a reader without access to the publication page (where
 * borrowing and the reason live), and start the reader's code, its personal copy and the locator in parallel.
 */
export const readerLoader = async ({ params, request }: LoaderFunctionArgs): Promise<IReaderRouteData | Response> => {
  const entryId = params.entryId!;
  const url = new URL(request.url);
  const catalogId = url.searchParams.get('catalog');
  const file = url.searchParams.get('file');
  if (!readStoredAuth()) return redirect(loginPath(here(request)));

  // The reader's chunk (the largest) downloads while the publication and its copy are fetched.
  loadViewer().catch(() => undefined);

  if (!canCallApi()) return { entryId, catalogId, file, resolved: null };

  let entry: IEntryDetail;
  try {
    entry = await queryClient.ensureQueryData(entryDetailQuery(entryId, catalogId));
  } catch (error) {
    const status = httpStatus(error);
    if (status === 401) return redirect(loginPath(here(request)));
    // The page says why (not found / not available) in the reader's language.
    if (status === 403 || status === 404) return redirect(entryPath(entryId, { catalogId }));
    throw error;
  }

  const resolved = resolveReaderFile(entry, file);
  if (!resolved) {
    notReadableHere();
    return redirect(entryPath(entryId, { catalogId: entry.catalog_id }));
  }
  startReaderSession(entryId, resolved.acquisitionId, url.searchParams.get('loc'));

  return { entryId, catalogId: entry.catalog_id ?? catalogId, file, resolved };
};

/**
 * The reader writes its page, search and panel into the URL as the reader moves; none of that is a new
 * document. Only another publication, file or catalog runs the loader (and remounts the reader) again.
 */
export const readerShouldRevalidate = ({ currentUrl, nextUrl, currentParams, nextParams }: ShouldRevalidateFunctionArgs) =>
  currentParams.entryId !== nextParams.entryId ||
  currentUrl.searchParams.get('file') !== nextUrl.searchParams.get('file') ||
  currentUrl.searchParams.get('catalog') !== nextUrl.searchParams.get('catalog');

/** `/viewer/:entry-id/:index` (before semantic URLs): the same place at its new address. */
export const legacyViewerLoader = async ({ params, request }: LoaderFunctionArgs) => {
  const entryId = params['entry-id']!;
  const url = new URL(request.url);
  let file: string | undefined;
  // The index names a file only through the publication; without a usable token, the readable PDF.
  if (canCallApi()) {
    try {
      const entry = await queryClient.ensureQueryData(entryDetailQuery(entryId));
      const acquisition = entry.acquisitions[Number(params.index) || 0];
      if (acquisition && entry.acquisitions.indexOf(acquisition) !== readablePdfIndex(entry)) file = acquisition.id;
    } catch {
      // The reader route answers for an unknown or hidden publication.
    }
  }
  return redirect(
    readerPath(entryId, {
      file,
      page: Number(url.searchParams.get('page')) || undefined,
      p: url.searchParams.get('p'),
      r: url.searchParams.get('r'),
    }),
  );
};

/**
 * `/cite/:entryId/:key` (#46): the durable passage link lands on the reader with the locator in the URL, so
 * a refresh or a copied address keeps the highlight. The reader resolves it (relocated / page only notes).
 */
export const citeLoader = ({ params }: LoaderFunctionArgs) => {
  if (!params.entryId || !params.key) return redirect(NAVIGATION_PATHS.notFound);
  return redirect(readerPath(params.entryId, { loc: params.key }));
};
