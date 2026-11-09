import { useTranslation } from 'react-i18next';
import Select from '../primitives/Select';

/** Display value of the relevance sort — a search with no `order-by` at all. */
export const RELEVANCE = 'relevance';

interface ISortSelect {
  value: string;
  onChange: (value: string) => void;
  /** Offer "Relevance" — only meaningful while a search query is active. */
  withRelevance?: boolean;
}

const SortSelect = ({ value, onChange, withRelevance = false }: ISortSelect) => {
  const { t } = useTranslation();

  const options = [
    ...(withRelevance ? [{ value: RELEVANCE, label: t('tools.orderBy.relevance') }] : []),
    { value: 'created_at', label: t('tools.orderBy.createdAtAsc') },
    { value: '-created_at', label: t('tools.orderBy.createdAtDesc') },
    { value: 'title', label: t('tools.orderBy.titleAsc') },
    { value: '-title', label: t('tools.orderBy.titleDesc') },
    { value: '-popularity', label: t('tools.orderBy.popularityDesc') },
    { value: 'popularity', label: t('tools.orderBy.popularityAsc') },
    { value: '-rating', label: t('tools.orderBy.ratingDesc') },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      aria-label={t('common.sortBy')}
      className="ml-auto w-fit min-w-[180px]"
      triggerClassName="border-none dark:text-white"
    />
  );
};

export default SortSelect;
