import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { IEntrySearchMeta } from '../../../utils/interfaces/entry';

/**
 * Weak-result hints for a search: a one-click spelling correction
 * (`did_you_mean`) and, when nothing matched exactly (`relaxed`), a note that the
 * results are related ones.
 */
const SearchNotice = ({ search }: { search?: IEntrySearchMeta | null }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const didYouMean = search?.did_you_mean;
  // Only for the query currently in the URL (stale data is kept while the next loads).
  const current = searchParams.get('query')?.trim().toLowerCase();
  if (!search || !current || (search.query && search.query.trim().toLowerCase() !== current)) return null;
  if (!didYouMean && !search.relaxed) return null;

  const correct = (query: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('query', query);
    setSearchParams(params);
  };

  return (
    <div className="mx-4 mb-4 flex flex-col gap-1 rounded-md bg-lightGray dark:bg-strongDarkGray px-4 py-3 text-sm text-secondary dark:text-secondaryLight">
      {didYouMean && (
        <p>
          {t('search.didYouMean')}{' '}
          <button
            type="button"
            onClick={() => correct(didYouMean)}
            className="font-semibold italic text-primaryText dark:text-primaryLight hover:underline"
          >
            {didYouMean}
          </button>
          ?
        </p>
      )}
      {search.relaxed && <p>{t('search.relaxed')}</p>}
    </div>
  );
};

export default SearchNotice;
