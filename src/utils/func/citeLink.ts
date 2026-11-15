import { NAVIGATION_PATHS } from '../interfaces/general/general';

/** A durable citation link (elvira-portal#46): `/cite/{entry_id}/{locator_key}`, resolved by the catalog on open. */
export const citePath = (entryId: string, key: string) =>
  `${NAVIGATION_PATHS.cite}${encodeURIComponent(entryId)}/${encodeURIComponent(key)}`;
