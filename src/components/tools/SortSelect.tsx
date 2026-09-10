import { useTranslation } from 'react-i18next';
import Select from '../primitives/Select';

interface ISortSelect {
  value: string;
  onChange: (value: string) => void;
}

const SortSelect = ({ value, onChange }: ISortSelect) => {
  const { t } = useTranslation();

  const options = [
    { value: 'created_at', label: t('tools.orderBy.createdAtAsc') },
    { value: '-created_at', label: t('tools.orderBy.createdAtDesc') },
    { value: 'title', label: t('tools.orderBy.titleAsc') },
    { value: '-title', label: t('tools.orderBy.titleDesc') },
    { value: '-popularity', label: t('tools.orderBy.popularityDesc') },
    { value: 'popularity', label: t('tools.orderBy.popularityAsc') },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      aria-label="Sort By"
      className="ml-auto w-fit min-w-[180px]"
      triggerClassName="border-none dark:text-white"
    />
  );
};

export default SortSelect;
