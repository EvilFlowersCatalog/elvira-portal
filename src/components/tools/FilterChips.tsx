import { RiCloseLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';

export interface FilterChipItem {
  key: string;
  value: string;
  label: string;
  itemId?: string;
}

interface IFilterChips {
  filters: FilterChipItem[];
  onRemove: (key: string, itemId?: string) => void;
  onClear: () => void;
}

const FilterChips = ({ filters, onRemove, onClear }: IFilterChips) => {
  const { t } = useTranslation();

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 w-full max-lg:order-3 max-lg:col-span-2">
      {filters.map((filter, index) => (
        <div
          key={`${filter.key}-${filter.itemId || filter.value}-${index}`}
          className="flex items-center gap-1 px-3 py-1 rounded-md bg-primaryLight dark:bg-primaryDark text-primaryText dark:text-primaryLight font-medium text-xs"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemove(filter.key, filter.itemId)}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove ${filter.label} filter`}
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      ))}
      <button
        className="text-sm text-secondary dark:text-secondaryLight font-semibold hover:underline"
        onClick={onClear}
      >
        {t('tools.clearFilters')}
      </button>
    </div>
  );
};

export default FilterChips;
