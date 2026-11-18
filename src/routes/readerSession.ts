import { baseAxios } from '../hooks/api/useAxios';
import { IUserAcquisitionResponse } from '../utils/interfaces/acquisition';
import { ILocator } from '../utils/interfaces/locator';

/**
 * Work the reader needs before it can paint, started by the route loader so it runs in parallel with the
 * reader's code chunk instead of after it: the personal copy (`POST /user-acquisitions`) and, for a passage
 * link, its locator. The reader takes what was started (once) and starts anything missing itself.
 *
 * Measured order before this: chunk → entry detail → personal copy → viewer. Now: chunk ∥ (detail, cached
 * from the dialog) → copy ∥ locator → viewer.
 */
export interface IReaderSession {
  copy: Promise<IUserAcquisitionResponse>;
  locator: Promise<ILocator | null> | null;
}

const sessions = new Map<string, { session: IReaderSession; at: number }>();

/** A session older than this is not reused (the copy's signed URLs have a lifetime). */
const MAX_AGE_MS = 60_000;

const key = (acquisitionId: string, loc: string | null) => `${acquisitionId}|${loc ?? ''}`;

export const createPersonalCopy = async (acquisitionId: string) => {
  const { data } = await baseAxios.post<{ response: IUserAcquisitionResponse }>('/api/v1/user-acquisitions', {
    acquisition_id: acquisitionId,
    type: 'personal',
  });
  return data.response;
};

export const fetchLocator = async (entryId: string, loc: string): Promise<ILocator> => {
  const { data } = await baseAxios.get<{ response: ILocator }>(
    `/api/v1/locators/${encodeURIComponent(entryId)}/${encodeURIComponent(loc)}`,
  );
  return data.response;
};

export const startReaderSession = (entryId: string, acquisitionId: string, loc: string | null) => {
  // The loader can run twice for one open (login redirects to `next` from two places): one copy is enough.
  const existing = sessions.get(key(acquisitionId, loc));
  if (existing && Date.now() - existing.at < MAX_AGE_MS) return;
  const copy = createPersonalCopy(acquisitionId);
  const session: IReaderSession = { copy, locator: loc ? fetchLocator(entryId, loc) : null };
  // Unclaimed failures must not surface as unhandled rejections; the reader handles them when it takes them.
  copy.catch(() => undefined);
  session.locator?.catch(() => undefined);
  sessions.set(key(acquisitionId, loc), { session, at: Date.now() });
};

/** The session the loader started for this file and passage, or a fresh one. Claimed once. */
export const takeReaderSession = (entryId: string, acquisitionId: string, loc: string | null): IReaderSession => {
  const k = key(acquisitionId, loc);
  const found = sessions.get(k);
  sessions.delete(k);
  if (found && Date.now() - found.at < MAX_AGE_MS) return found.session;
  return {
    copy: createPersonalCopy(acquisitionId),
    locator: loc ? fetchLocator(entryId, loc) : null,
  };
};
