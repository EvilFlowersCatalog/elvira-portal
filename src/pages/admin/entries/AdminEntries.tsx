import { useTranslation } from 'react-i18next';
import AdminEntriesTable from '../../../components/items/entry/admin/AdminEntriesTable';
import ToolsContainer from '../../../components/tools/ToolsContainer';
import { H1 } from '../../../components/primitives/Heading';

const AdminEntries = () => {
  const { t } = useTranslation();
  return (
    <div className='pt-10 overflow-auto pb-10'>
      <H1>{t('administration.homePage.entries.title')}</H1>
      <ToolsContainer param={'query'} advancedSearch={true} />
      <AdminEntriesTable></AdminEntriesTable>
    </div>
  );
};

export default AdminEntries;
