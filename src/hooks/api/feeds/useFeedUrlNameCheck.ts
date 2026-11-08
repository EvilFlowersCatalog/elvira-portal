import { useMemo } from 'react';
import useDebouncedValue from '../../useDebouncedValue';
import useFeedsQuery from './useFeedsQuery';
import { IFeed } from '../../../utils/interfaces/feed';

export type UrlNameStatus = 'idle' | 'checking' | 'available' | 'taken';

interface Options {
  enabled: boolean;
  /** The feed being edited — its own slug never counts as a conflict. */
  feedId?: string;
  /** The edited feed's saved slug; skips the lookup while it is unchanged. */
  ownUrlName?: string;
}

/**
 * Debounced live availability of a feed `url_name` in the current catalog
 * (`GET /api/v1/feeds?url_name=<slug>`, exact match; empty `items` = free).
 */
const useFeedUrlNameCheck = (urlName: string, { enabled, feedId, ownUrlName }: Options) => {
  const slug = urlName.trim();
  const debouncedSlug = useDebouncedValue(slug, 300);
  const isOwn = (s: string) => !!ownUrlName && s === ownUrlName;

  const { data, isError } = useFeedsQuery(
    { urlName: debouncedSlug, paginate: false },
    { enabled: enabled && !!debouncedSlug && !isOwn(debouncedSlug) }
  );

  // Exact-match guard: a backend without the `url_name` filter ignores it and returns everything.
  const conflict: IFeed | undefined = useMemo(
    () => data?.items.find((f) => f.url_name === debouncedSlug && f.id !== feedId),
    [data, debouncedSlug, feedId]
  );

  let status: UrlNameStatus = 'idle';
  if (slug && !isOwn(slug) && !isError) {
    if (slug !== debouncedSlug || !data) status = 'checking';
    else status = conflict ? 'taken' : 'available';
  }

  return { status, conflict: status === 'taken' ? conflict : undefined, checkedSlug: debouncedSlug };
};

export default useFeedUrlNameCheck;
