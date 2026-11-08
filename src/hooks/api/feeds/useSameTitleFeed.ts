import { useMemo } from 'react';
import useDebouncedValue from '../../useDebouncedValue';
import useFeedsQuery from './useFeedsQuery';
import { IFeed } from '../../../utils/interfaces/feed';
import { DEFAULT_CONTENT_LANGUAGE, toLocalized } from '../../../utils/func/localized';

/**
 * Another feed in the catalog whose default-language (sk) title equals `title`
 * (case-insensitive), excluding `feedId`. Titles need not be unique — this only
 * powers a non-blocking hint against accidental duplicates.
 */
const useSameTitleFeed = (title: string, { enabled, feedId }: { enabled: boolean; feedId?: string }): IFeed | undefined => {
  const needle = title.trim();
  const debounced = useDebouncedValue(needle, 300);
  // The `title` filter is `icontains`; narrow to an exact match below.
  const { data } = useFeedsQuery({ title: debounced, paginate: false }, { enabled: enabled && !!debounced });

  const match = useMemo(() => {
    const lower = debounced.toLowerCase();
    return data?.items.find(
      (f) => f.id !== feedId && (toLocalized(f.title)[DEFAULT_CONTENT_LANGUAGE] ?? '').trim().toLowerCase() === lower
    );
  }, [data, debounced, feedId]);

  return needle === debounced ? match : undefined;
};

export default useSameTitleFeed;
