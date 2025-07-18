import { useTranslation } from 'react-i18next';
import AdminEntriesTable from '../../../components/items/entry/admin/AdminEntriesTable';
import ToolsContainer from '../../../components/tools/ToolsContainer';
import { H1 } from '../../../components/primitives/Heading';
import Breadcrumb from '../../../components/buttons/Breadcrumb';

const AdminEntries = () => {
  const { t } = useTranslation();
  return (
    <div className='overflow-auto pb-10'>
      <Breadcrumb />
      <H1>{t('administration.homePage.entries.title')}</H1>
      <ToolsContainer param={'query'} advancedSearch={true} />
      <AdminEntriesTable></AdminEntriesTable>
    </div>
  );
};

export default AdminEntries;
