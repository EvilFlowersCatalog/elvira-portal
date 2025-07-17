import { useTranslation } from 'react-i18next';
import AdminEntriesTable from '../../../components/items/entry/admin/AdminEntriesTable';
import ToolsContainer from '../../../components/tools/ToolsContainer';

const AdminEntries = () => {
  const { t } = useTranslation();
  return (
    <div className='pt-10 overflow-auto pb-10'>
      <h1 className='px-4 text-secondary dark:text-secondaryLight text-4xl font-extrabold text-left mb-4'>{t('administration.homePage.entries.title')}</h1>
      <ToolsContainer param={'query'} advancedSearch={true} />
      <AdminEntriesTable></AdminEntriesTable>
    </div>
  );
};

export default AdminEntries;
