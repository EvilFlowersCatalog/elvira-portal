import { useTranslation } from 'react-i18next';
import AdminEntriesTable from '../../../components/items/entry/admin/AdminEntriesTable';
import ToolsContainer from '../../../components/tools/ToolsContainer';
import { H1 } from '../../../components/primitives/Heading';
import Breadcrumb from '../../../components/buttons/Breadcrumb';
import { AdvancedSearchWrapper } from '../../../components/items/container/AdvancedSearch';
import OpenFiltersButton from '../../../components/buttons/OpenFiltersButton';

const AdminEntries = () => {
  const { t } = useTranslation();

  return (
    <div className='overflow-auto pb-10'>
      <Breadcrumb />
      <H1>{t('administration.homePage.entries.title')}</H1>
      <ToolsContainer param={'query'} advancedSearch={true} enableSort={false} />
      <AdvancedSearchWrapper>
        <AdminEntriesTable></AdminEntriesTable>
      </AdvancedSearchWrapper>
      <OpenFiltersButton />
    </div>
  );
};

export default AdminEntries;
