import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MUISelectStyle } from '../inputs/ElviraSelect';

interface ISortSelect {
  value: string;
  onChange: (e: SelectChangeEvent) => void;
}

const SortSelect = ({ value, onChange }: ISortSelect) => {
  const { t } = useTranslation();

  return (
    <Select
      className="ml-auto dark:text-white"
      sx={MUISelectStyle}
      MenuProps={{
        PaperProps: {
          sx: { '& .MuiList-root': { paddingBottom: 0, paddingTop: 0 } },
        },
      }}
      label={'Sort By'}
      value={value}
      labelId="sort-label"
      id="orderBy"
      onChange={onChange}
      variant="standard"
    >
      <MenuItem value="created_at">{t('tools.orderBy.createdAtAsc')}</MenuItem>
      <MenuItem value="-created_at">{t('tools.orderBy.createdAtDesc')}</MenuItem>
      <MenuItem value="title">{t('tools.orderBy.titleAsc')}</MenuItem>
      <MenuItem value="-title">{t('tools.orderBy.titleDesc')}</MenuItem>
      <MenuItem value="-popularity">{t('tools.orderBy.popularityDesc')}</MenuItem>
      <MenuItem value="popularity">{t('tools.orderBy.popularityAsc')}</MenuItem>
    </Select>
  );
};

export default SortSelect;
