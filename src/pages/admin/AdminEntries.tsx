import AdminEntryContainer from '../../components/data-page/entry/admin/AdminEntryContainer';
import DataProvider from '../../contexts/DataProvider';
import { DATA_TYPE } from '../../utils/interfaces/general/general';

const AdminEntries = () => {
  return (
    <DataProvider type={DATA_TYPE.entries}>
      <AdminEntryContainer />
    </DataProvider>
  );
};

export default AdminEntries;
