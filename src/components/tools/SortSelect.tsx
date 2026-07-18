import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface ISortSelect {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

const SortSelect = ({ value, onChange }: ISortSelect) => {
  const { t } = useTranslation();

  return (
    <select
      className="ml-auto bg-transparent outline-none p-2 dark:text-white"
      value={value}
      id="orderBy"
      aria-label="Sort By"
      onChange={onChange}
    >
      <option value="created_at">{t('tools.orderBy.createdAtAsc')}</option>
      <option value="-created_at">{t('tools.orderBy.createdAtDesc')}</option>
      <option value="title">{t('tools.orderBy.titleAsc')}</option>
      <option value="-title">{t('tools.orderBy.titleDesc')}</option>
      <option value="-popularity">{t('tools.orderBy.popularityDesc')}</option>
      <option value="popularity">{t('tools.orderBy.popularityAsc')}</option>
    </select>
  );
};

export default SortSelect;
